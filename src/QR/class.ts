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

import { optimizeEncoding } from './optimizeEncoding/index.js'
import { restoreEncoding } from './restoreEncoding/index.js'
import { display } from './display/index.js'
import { print } from './print/index.js'
import { scan } from './scan/index.js'

/**
 * Namespace wrapper for the package's managed QR user-interface flows.
 */
export class QR {
  /**
   * Optimizes a string for QR transport by optionally compressing it and always base45 encoding it.
   *
   * This is useful for structured payloads such as stringified JSON where raw QR encoding
   * would otherwise become visually noisy or require a denser symbol.
   *
   * @param value String value to optimize for QR transport.
   * @returns A base45 string with a one-byte strategy flag prefix.
   * @throws {QRError} Thrown when `value` is not a string.
   */
  static optimizeEncoding(value: string): Promise<string> {
    return optimizeEncoding(value)
  }

  /**
   * Restores an optimized QR payload produced by {@link optimizeEncoding}.
   *
   * @param value Base45-encoded optimized payload.
   * @returns The original decoded string.
   * @throws {QRError} Thrown when `value` is not a string.
   */
  static restoreEncoding(value: string): Promise<string> {
    return restoreEncoding(value)
  }

  /**
   * Opens a modal dialog that renders the provided string as a QR code.
   *
   * The QR image is generated as SVG and displayed from a temporary `blob:` URL.
   *
   * @param value String value to encode.
   * @throws {QRError} Thrown when `value` is not a string or encoding fails.
   */
  static display(value: string): void {
    return display(value)
  }

  /**
   * Opens a print-friendly document containing repeated QR cards for the provided string.
   *
   * The generated document uses an A4 layout and triggers the browser print dialog.
   *
   * @param value String value to encode.
   * @throws {QRError} Thrown when `value` is not a string or encoding fails.
   */
  static print(value: string): void {
    return print(value)
  }

  /**
   * Opens a modal camera scanner and resolves with the first decoded QR payload.
   *
   * @returns A promise that fulfills with the decoded QR code string.
   * @throws {QRError} Thrown when camera probing fails, no camera is available,
   * scanner startup fails, or the interaction is cancelled.
   */
  static scan(): Promise<string> {
    return scan()
  }
}
