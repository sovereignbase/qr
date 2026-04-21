import {
  concat,
  fromString,
  toCompressed,
  toBase45String,
} from '@sovereignbase/bytecodec'

import { QRError } from '../../.errors/class.js'

/**
 * Optimizes a string for QR transport by optionally compressing it and always base45 encoding it.
 *
 * This is useful for dense payloads such as stringified JSON where a raw QR payload
 * would otherwise become visually noisy or require a denser symbol version.
 *
 * @param value String value to optimize for QR transport.
 * @returns A base45 string with a one-byte strategy flag prefix.
 * @throws {QRError} Thrown when `value` is not a string.
 */
export async function optimizeEncoding(value: string): Promise<string> {
  if (typeof value !== 'string') throw new QRError('VALUE_IS_NOT_A_STRING')
  let utf8bytes: Uint8Array
  const bytes = fromString(value)
  const compressed = await toCompressed(bytes)
  compressed.length < bytes.length
    ? (utf8bytes = concat([[1], compressed]))
    : (utf8bytes = concat([[0], bytes]))

  return toBase45String(utf8bytes)
}
