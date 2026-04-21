import assert from 'node:assert/strict'
import test from 'node:test'

import { installDomHarness } from '../.helpers/dom-harness.mjs'
import { display } from '../../dist/index.js'
import { resetQrStub } from '../stubs/qr.mjs'

test('display uses requestAnimationFrame-based fade reveals when available', () => {
  resetQrStub()
  const dom = installDomHarness()
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame
  let rafCalls = 0

  globalThis.requestAnimationFrame = (callback) => {
    rafCalls += 1
    callback()
    return rafCalls
  }

  try {
    display('raf-display')

    const img = dom.getLastElement('img')
    const dialog = dom.getLastElement('dialog')
    assert.ok(img)
    assert.ok(dialog)

    img.onload()
    assert.equal(rafCalls >= 4, true)

    dom.dispatchWindow('pointerup')
    assert.equal(dialog.removed, true)
  } finally {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame
    dom.restore()
  }
})

test('display uses dialog backdrop animation when supported', () => {
  resetQrStub()
  const dom = installDomHarness()
  const originalCreateElement = globalThis.document.createElement
  const animateCalls = []

  globalThis.document.createElement = (tagName) => {
    const element = originalCreateElement(tagName)
    if (tagName === 'dialog') {
      element.animate = (frames, options) => {
        animateCalls.push({ frames, options })
        return { cancel() {} }
      }
    }
    return element
  }

  try {
    display('animated-backdrop')

    const dialog = dom.getLastElement('dialog')
    assert.ok(dialog)

    dom.dispatchWindow('pointerup')

    assert.equal(dialog.removed, true)
    assert.equal(animateCalls.length, 2)
    assert.equal(animateCalls[0].options.pseudoElement, '::backdrop')
    assert.equal(animateCalls[1].options.pseudoElement, '::backdrop')
  } finally {
    globalThis.document.createElement = originalCreateElement
    dom.restore()
  }
})

test('display falls back to computed backdrop overlay color and clears pending timeout', () => {
  resetQrStub()
  const dom = installDomHarness()
  const originalCreateElement = globalThis.document.createElement
  const originalGetComputedStyle = globalThis.getComputedStyle
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame
  const originalSetTimeout = globalThis.setTimeout
  const originalClearTimeout = globalThis.clearTimeout

  let timeoutId = 0
  let executedDelayedCallbacks = 0
  const clearedTimeouts = []

  globalThis.document.createElement = (tagName) => {
    const element = originalCreateElement(tagName)
    if (tagName === 'dialog') {
      element.close = () => {
        const listeners = [...(element.listeners.get('close') ?? [])].reverse()
        for (const listener of listeners) listener({})
      }
    }
    return element
  }

  globalThis.getComputedStyle = () => ({
    backgroundColor: 'rgba(9, 8, 7, 0.6)',
  })

  globalThis.requestAnimationFrame = (callback) => {
    callback()
    return 1
  }

  globalThis.setTimeout = (callback, delay, ...args) => {
    timeoutId += 1
    const id = timeoutId

    if (delay === 0) {
      callback(...args)
      return id
    }

    if (executedDelayedCallbacks < 2) {
      executedDelayedCallbacks += 1
      callback(...args)
      return id
    }

    return id
  }

  globalThis.clearTimeout = (id) => {
    clearedTimeouts.push(id)
  }

  try {
    display('fallback-overlay')

    const dialog = dom.getLastElement('dialog')
    assert.ok(dialog)

    dom.dispatchWindow('pointerup')

    const overlay = dom.getLastElement('div')
    assert.ok(overlay)
    assert.equal(overlay.style.background, 'rgba(9, 8, 7, 0.6)')
    assert.equal(overlay.removed, true)
    assert.equal(clearedTimeouts.length >= 1, true)
    assert.equal(dialog.removed, true)
  } finally {
    globalThis.document.createElement = originalCreateElement
    globalThis.getComputedStyle = originalGetComputedStyle
    globalThis.requestAnimationFrame = originalRequestAnimationFrame
    globalThis.setTimeout = originalSetTimeout
    globalThis.clearTimeout = originalClearTimeout
    dom.restore()
  }
})

test('display exits fallback backdrop handling when body is unavailable', () => {
  resetQrStub()
  const dom = installDomHarness()
  const originalCreateElement = globalThis.document.createElement

  globalThis.document.createElement = (tagName) => {
    const element = originalCreateElement(tagName)
    if (tagName === 'dialog') {
      element.close = () => {
        element.dispatch('close')
      }
    }
    return element
  }

  try {
    display('no-body-overlay')

    const dialog = dom.getLastElement('dialog')
    assert.ok(dialog)

    globalThis.document.body = null
    dom.dispatchWindow('pointerup')

    assert.equal(dialog.removed, true)
  } finally {
    globalThis.document.createElement = originalCreateElement
    dom.restore()
  }
})

test('display tolerates backdrop animation and computed-style failures', () => {
  resetQrStub()
  const dom = installDomHarness()
  const originalCreateElement = globalThis.document.createElement
  const originalGetComputedStyle = globalThis.getComputedStyle

  globalThis.document.createElement = (tagName) => {
    const element = originalCreateElement(tagName)
    if (tagName === 'dialog') {
      element.animate = () => ({
        cancel() {
          throw new Error('cancel failed')
        },
      })
      element.close = () => {
        element.dispatch('close')
      }
    }
    return element
  }

  globalThis.getComputedStyle = () => {
    throw new Error('unsupported pseudo-element')
  }

  try {
    display('backdrop-failure')

    const dialog = dom.getLastElement('dialog')
    assert.ok(dialog)

    dom.dispatchWindow('pointerup')

    assert.equal(dialog.removed, true)
  } finally {
    globalThis.document.createElement = originalCreateElement
    globalThis.getComputedStyle = originalGetComputedStyle
    dom.restore()
  }
})
