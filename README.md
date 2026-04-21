[![npm version](https://img.shields.io/npm/v/@sovereignbase/qr)](https://www.npmjs.com/package/@sovereignbase/qr)
[![CI](https://github.com/sovereignbase/qr/actions/workflows/ci.yaml/badge.svg?branch=master)](https://github.com/sovereignbase/qr/actions/workflows/ci.yaml)
[![codecov](https://codecov.io/gh/sovereignbase/qr/branch/master/graph/badge.svg)](https://codecov.io/gh/sovereignbase/qr)
[![license](https://img.shields.io/npm/l/@sovereignbase/qr)](LICENSE)

# qr

A simple, managed QR toolset for browser frontends. It gives SPAs a small API to display, print, scan, and optimize QR payloads with typed errors and zero framework lock-in.

## Compatibility

- Runtimes: modern browsers; Node >= 20 for build/test workflows.
- Module format: ESM and CJS.
- Required browser APIs: `document`, `<dialog>`, `Blob`, `URL.createObjectURL`, and camera/media APIs for scanning.
- TypeScript: bundled types.

## Goals

- Minimal API for common frontend QR workflows.
- Managed UI flows for display, print, and scan.
- Optional payload optimization for dense inputs before QR generation.
- Typed, explicit errors for predictable app-level handling.
- Works cleanly in SPA environments without framework-specific code.

## Installation

```sh
npm install @sovereignbase/qr
# or
pnpm add @sovereignbase/qr
# or
yarn add @sovereignbase/qr
# or
bun add @sovereignbase/qr
# or
deno add jsr:@sovereignbase/qr
# or
vlt install jsr:@sovereignbase/qr
```

## Usage

```ts
import { QR, QRError } from '@sovereignbase/qr'

const payload = JSON.stringify({
  issuer: 'sovereignbase',
  subject: 'example',
  scopes: ['display', 'print', 'scan'],
})

const optimized = await QR.optimizeEncoding(payload)

QR.display(optimized)
QR.print(optimized)

try {
  const scanResult = await QR.scan()
  const restored = await QR.restoreEncoding(scanResult)
  console.log(JSON.parse(restored))
} catch (error) {
  if (error instanceof QRError) {
    console.error(error.code, error.message)
  } else {
    console.error(error)
  }
}
```

You can also import function-level APIs directly:

```ts
import {
  display,
  optimizeEncoding,
  print,
  restoreEncoding,
  scan,
} from '@sovereignbase/qr'
```

## API

### `QR.optimizeEncoding(value: string): Promise<string>`

- Optionally compresses the UTF-8 payload when that reduces size.
- Always base45 encodes the transport form.
- Best suited to complex string payloads such as stringified JSON, signed objects, and other dense structured data.
- Returns a QR-safe string intended to be passed into `display()` or `print()`.

### `QR.restoreEncoding(value: string): Promise<string>`

- Reverses `optimizeEncoding()`.
- Base45 decodes the input and decompresses it only when the optimized payload indicates compression was used.
- Useful after `scan()` when the QR payload was created with `optimizeEncoding()`.

### `QR.display(value: string): void`

- Opens a modal dialog with a generated QR image for `value`.
- Closes on user interaction (pointer/mouse/touch/key) after a short guard delay.

### `QR.print(value: string): void`

- Opens a new tab with an A4 print layout of ID-1 sized QR cards.
- Triggers the browser print dialog automatically.

### `QR.scan(): Promise<string>`

- Opens a modal camera scanner.
- Resolves with decoded QR payload.
- Rejects with `QRError` when scanning cannot proceed or is cancelled.
- Uses the same short interaction guard delay pattern as `display()` before close listeners activate.

## Errors

The package throws `QRError` with semantic `code` values:

- `VALUE_IS_NOT_A_STRING`
- `QR_ENCODE_FAILED`
- `NO_CAMERA_AVAILABLE`
- `CAMERA_CHECK_FAILED`
- `SCAN_CANCELLED`
- `SCAN_START_FAILED`

## Runtime Notes

- This package is browser-first and UI-driven.
- `optimizeEncoding()` and `restoreEncoding()` are transport helpers for string payloads.
- For structured inputs, prefer `QR.display(await QR.optimizeEncoding(JSON.stringify(data)))` over embedding raw JSON directly in the QR payload.
- `scan()` requires camera permission and a compatible device/browser.
- `print()` relies on popup/new-tab behavior and browser print support.
- Dialog/content/backdrop fade transitions are best-effort and may vary slightly by engine capabilities.

## Tests

- Suite: unit + integration (Node), E2E (Playwright)
- Matrix: Chromium / Firefox / WebKit + mobile emulation (Pixel 5, iPhone 12)
- Coverage: c8 - 100% statements/branches/functions/lines

## License

Apache-2.0
