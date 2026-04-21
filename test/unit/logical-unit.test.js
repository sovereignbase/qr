import assert from 'node:assert/strict'
import test from 'node:test'

import { QRError } from '../../dist/index.js'

test('QRError uses explicit message when provided', () => {
  const error = new QRError('SCAN_CANCELLED', 'QR cancelled by user')
  assert.equal(error.code, 'SCAN_CANCELLED')
  assert.equal(error.name, 'QRError')
  assert.equal(error.message, '{@sovereignbase/qr} QR cancelled by user')
})

test('QRError falls back to code when message is omitted', () => {
  const error = new QRError('SCAN_START_FAILED')
  assert.equal(error.code, 'SCAN_START_FAILED')
  assert.equal(error.name, 'QRError')
  assert.equal(error.message, '{@sovereignbase/qr} SCAN_START_FAILED')
})
