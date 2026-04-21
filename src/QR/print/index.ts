/*
 * Copyright 2026 Sovereignbase
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import encodeQR from 'qr'
import { QRError } from '../../.errors/class.js'
import { getErrorMessage } from '../../.helpers/getErrorMessage/index.js'

/**
 * Opens a print-friendly document containing repeated QR cards for the provided string.
 *
 * The generated document uses an A4 grid of ID-1 cards, opens in a new tab or
 * window, and then invokes the browser print dialog from that context.
 *
 * @param value String value to encode.
 * @throws {QRError} Thrown when `value` is not a string or encoding fails.
 */
export function print(value: string): void {
  if (typeof value !== 'string')
    throw new QRError(
      'VALUE_IS_NOT_A_STRING',
      'This library only accepts strings as value, use `@sovereignbase/bytecodec` for conversions'
    )

  // A4 portrait defaults.
  const PAGE_MM = { w: 210, h: 297 }
  const PAGE_MARGIN_MM = 8

  // ISO/IEC 7810 ID-1 card dimensions.
  const CARD_MM = { w: 85.6, h: 53.98 }
  const CARD_PADDING_MM = 4

  // Clamp the QR size to a value that prints cleanly inside the card tile.
  const QR_ON_CARD_MM = 42

  // Cut guides and crop marks.
  const CUTLINE_MM = 0.35
  const CROP_LEN_MM = 3.5
  const CROP_OFF_MM = 1.2

  const printableW = PAGE_MM.w - 2 * PAGE_MARGIN_MM
  const printableH = PAGE_MM.h - 2 * PAGE_MARGIN_MM

  const cols = Math.max(1, Math.floor(printableW / CARD_MM.w))
  const rows = Math.max(1, Math.floor(printableH / CARD_MM.h))
  const count = cols * rows

  const maxQrMm = CARD_MM.h - 2 * CARD_PADDING_MM
  const qrMm = Math.max(10, Math.min(QR_ON_CARD_MM, maxQrMm))

  let svg = ''
  try {
    svg = encodeQR(value, 'svg')
  } catch (error: unknown) {
    throw new QRError(
      'QR_ENCODE_FAILED',
      getErrorMessage(error, 'Unable to encode value as QR SVG')
    )
  }

  const tiles = Array.from({ length: count }, () => {
    return `<div class="card">
      <div class="qr">${svg}</div>
      <i class="crop tl"></i><i class="crop tr"></i><i class="crop bl"></i><i class="crop br"></i>
    </div>`
  }).join('')

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    :root{
      --page-margin: ${PAGE_MARGIN_MM}mm;

      --card-w: ${CARD_MM.w}mm;
      --card-h: ${CARD_MM.h}mm;
      --pad: ${CARD_PADDING_MM}mm;

      --qr: ${qrMm}mm;

      --cut: ${CUTLINE_MM}mm;
      --crop-len: ${CROP_LEN_MM}mm;
      --crop-off: ${CROP_OFF_MM}mm;
    }

    @page { size: A4 portrait; margin: var(--page-margin); }

    html, body { margin: 0; padding: 0; background: #fff; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }

    .sheet{
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .grid{
      display: grid;
      grid-template-columns: repeat(${cols}, var(--card-w));
      grid-template-rows: repeat(${rows}, var(--card-h));
      gap: 0;
    }

    .card{
      position: relative;
      width: var(--card-w);
      height: var(--card-h);
      box-sizing: border-box;

      /* single-thickness shared edges */
      outline: var(--cut) dotted #000;
      outline-offset: calc(-1 * var(--cut));

      display: grid;
      place-items: center;
      padding: var(--pad);
    }

    .qr{
      width: var(--qr);
      height: var(--qr);
      display: grid;
      place-items: center;
    }

    .qr > svg{
      width: 100%;
      height: 100%;
      display: block;
    }

    .crop{
      position: absolute;
      width: var(--crop-len);
      height: var(--crop-len);
      pointer-events: none;
    }
    .crop.tl{ top: var(--crop-off); left: var(--crop-off); border-top: 0.35mm solid #000; border-left: 0.35mm solid #000; }
    .crop.tr{ top: var(--crop-off); right: var(--crop-off); border-top: 0.35mm solid #000; border-right: 0.35mm solid #000; }
    .crop.bl{ bottom: var(--crop-off); left: var(--crop-off); border-bottom: 0.35mm solid #000; border-left: 0.35mm solid #000; }
    .crop.br{ bottom: var(--crop-off); right: var(--crop-off); border-bottom: 0.35mm solid #000; border-right: 0.35mm solid #000; }

    @media screen{
      body { background: #eee; }
      .sheet{ padding: 16px; }
      .grid{ background: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="grid">
      ${tiles}
    </div>
  </div>

  <script>
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.focus();
        window.print();
      });
    });
    window.addEventListener('afterprint', () => {
      try { window.close(); } catch {}
    });
  </script>
</body>
</html>`

  const url = URL.createObjectURL(
    new Blob([html], { type: 'text/html;charset=utf-8' })
  )

  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  a.click()

  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
