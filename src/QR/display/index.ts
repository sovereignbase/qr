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
import { attachFadeStyles } from '../../.helpers/attachFadeStyles/index.js'
import { attachDialogBackdropFade } from '../../.helpers/attachDialogBackdropFade/index.js'
import { getErrorMessage } from '../../.helpers/getErrorMessage/index.js'

/**
 * Opens a modal dialog that renders the provided string as a QR code.
 *
 * The QR image is generated as SVG, loaded through a temporary `blob:` URL,
 * and dismissed on a subsequent user interaction after the initial guard delay.
 *
 * @param value String value to encode.
 * @throws {QRError} Thrown when `value` is not a string or encoding fails.
 */
export function display(value: string): void {
  if (typeof value !== 'string') {
    throw new QRError(
      'VALUE_IS_NOT_A_STRING',
      'This library only accepts strings as value, use `@sovereignbase/bytecodec` for conversions'
    )
  }

  const fadeMs = 333
  const dialog = document.createElement('dialog')

  dialog.style.border = 'none'
  dialog.style.padding = '0'
  dialog.style.background = '#fff'
  dialog.style.borderRadius = '1rem'
  dialog.style.display = 'flex'
  dialog.style.alignItems = 'center'
  dialog.style.justifyContent = 'center'
  dialog.style.outline = 'none'
  dialog.style.overflow = 'hidden'
  const dialogBackdropFade = attachDialogBackdropFade(dialog, fadeMs)
  const dialogFade = attachFadeStyles(dialog, fadeMs)

  let svgText = ''
  try {
    svgText = encodeQR(value, 'svg')
  } catch (error: unknown) {
    throw new QRError(
      'QR_ENCODE_FAILED',
      getErrorMessage(error, 'Unable to encode value as QR SVG')
    )
  }

  const url = URL.createObjectURL(
    new Blob([svgText], { type: 'image/svg+xml' })
  )

  const img = document.createElement('img')
  img.src = url
  img.alt = 'QR code'
  img.style.width = 'min(80vw, 400px)'
  img.style.height = 'auto'
  img.style.aspectRatio = '1 / 1'
  img.style.display = 'block'
  const imgFade = attachFadeStyles(img, fadeMs)

  dialog.append(img)
  document.body.append(dialog)
  dialog.showModal()
  dialogBackdropFade.reveal()
  dialogFade.reveal()

  const ac = new AbortController()
  let cleaned = false
  let closing = false

  const cleanup = (): void => {
    if (cleaned) return
    cleaned = true

    ac.abort()
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('touchend', onTouchEnd)
    window.removeEventListener('keydown', onKeyDown)

    img.onload = null
    URL.revokeObjectURL(url)

    dialogBackdropFade.detach()
    dialogFade.detach()
    imgFade.detach()
    dialog.remove()
  }

  const requestClose = (): void => {
    if (closing || cleaned) return
    closing = true

    dialogBackdropFade.hide()
    dialogFade.hide()
    imgFade.hide()

    setTimeout(() => {
      try {
        dialog.close()
      } catch {}
      cleanup()
    }, fadeMs)
  }

  img.onload = () => {
    URL.revokeObjectURL(url)
    imgFade.reveal()
  }
  if (img.complete) {
    URL.revokeObjectURL(url)
    imgFade.reveal()
  }

  const onPointerUp = (): void => requestClose()
  const onMouseUp = (): void => requestClose()
  const onTouchEnd = (): void => requestClose()
  const onKeyDown = (): void => requestClose()

  setTimeout(() => {
    window.addEventListener('pointerup', onPointerUp, { signal: ac.signal })
    window.addEventListener('mouseup', onMouseUp, { signal: ac.signal })
    window.addEventListener('touchend', onTouchEnd, { signal: ac.signal })
    window.addEventListener('keydown', onKeyDown, { signal: ac.signal })
    dialog.addEventListener('close', cleanup, { signal: ac.signal })
  }, fadeMs)
}
