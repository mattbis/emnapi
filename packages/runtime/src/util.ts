/* eslint-disable no-new-func */
/* eslint-disable @typescript-eslint/no-implied-eval */

declare const __webpack_public_path__: any
declare const __non_webpack_require__: ((id: string) => any) | undefined
declare const global: typeof globalThis

export const supportNewFunction = (function () {
  let f: Function
  try {
    f = new Function()
  } catch (_) {
    return false
  }
  return typeof f === 'function'
})()

export const _global: typeof globalThis = (function () {
  if (typeof globalThis !== 'undefined') return globalThis

  let g = (function (this: any) { return this })()
  if (!g && supportNewFunction) {
    try {
      g = new Function('return this')()
    } catch (_) {}
  }

  if (!g) {
    if (typeof __webpack_public_path__ === 'undefined') {
      if (typeof global !== 'undefined') return global
    }
    if (typeof window !== 'undefined') return window
    if (typeof self !== 'undefined') return self
  }

  return g
})()

const emptyException = new Error()

/** @internal */
export class TryCatch {
  private _exception: any = emptyException
  public hasCaught (): boolean {
    return this._exception !== emptyException
  }

  public exception (): any {
    return this._exception
  }

  public setError (err: any): void {
    this._exception = err
  }

  public reset (): void {
    this._exception = emptyException
  }

  public extractException (): any {
    const e = this._exception
    this.reset()
    return e
  }
}

export let canSetFunctionName = false
try {
  canSetFunctionName = !!Object.getOwnPropertyDescriptor(Function.prototype, 'name')?.configurable
} catch (_) {}

export const supportReflect = typeof Reflect === 'object'
export const supportFinalizer = (typeof FinalizationRegistry !== 'undefined') && (typeof WeakRef !== 'undefined')
export const supportBigInt = typeof BigInt !== 'undefined'

export function isReferenceType (v: any): v is object {
  return (typeof v === 'object' && v !== null) || typeof v === 'function'
}

export const _setImmediate = typeof setImmediate === 'function'
  ? setImmediate
  : function (f: () => void): void {
    if (typeof f !== 'function') return
    let channel = new MessageChannel()
    channel.port1.onmessage = function () {
      channel.port1.onmessage = null
      channel = undefined!
      f()
    }
    channel.port2.postMessage(null)
  }

export const construct = supportReflect
  ? Reflect.construct
  : function<R> (target: new (...args: any[]) => R, args: ArrayLike<any>, newTarget?: Function): R {
    const argsList = Array(args.length + 1) as [undefined, ...any[]]
    argsList[0] = undefined
    for (let i = 0; i < args.length; i++) {
      argsList[i + 1] = args[i]
    }
    const BoundCtor = target.bind.apply(target as any, argsList) as new () => any
    const instance = new BoundCtor()
    if (typeof newTarget === 'function') {
      Object.setPrototypeOf(instance, newTarget.prototype)
    }
    return instance
  }

const _require = (function () {
  let nativeRequire

  if (typeof __webpack_public_path__ !== 'undefined') {
    nativeRequire = (function () {
      return typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : undefined
    })()
  } else {
    nativeRequire = (function () {
      return typeof __webpack_public_path__ !== 'undefined' ? (typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : undefined) : (typeof require !== 'undefined' ? require : undefined)
    })()
  }

  return nativeRequire
})()

export const Buffer: BufferCtor | undefined = (function () {
  if (typeof _global.Buffer === 'function') return _global.Buffer

  try {
    return _require!('buffer').Buffer
  } catch (_) {}

  return undefined
})()
