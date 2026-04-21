import {
  toString,
  fromCompressed,
  fromBase45String,
} from '@sovereignbase/bytecodec'

import { QRError } from '../../.errors/class.js'

/**
 * Restores a payload previously produced by {@link optimizeEncoding}.
 *
 * The input is always base45-decoded first and decompressed only when the
 * optimized payload indicates that compression was used.
 *
 * @param scanResult Base45-encoded optimized payload.
 * @returns The original decoded string.
 * @throws {QRError} Thrown when `scanResult` is not a string.
 */
export async function restoreEncoding(scanResult: string): Promise<string> {
  if (typeof scanResult !== 'string') throw new QRError('VALUE_IS_NOT_A_STRING')
  let utf8bytes: Uint8Array
  const bytes = fromBase45String(scanResult)
  const flag = bytes[0]
  const value = bytes.subarray(1)

  flag === 1 ? (utf8bytes = await fromCompressed(value)) : (utf8bytes = value)

  return toString(utf8bytes)
}
