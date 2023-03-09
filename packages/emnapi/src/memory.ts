declare type ViewConstuctor =
  Int8ArrayConstructor |
  Uint8ArrayConstructor |
  Uint8ClampedArrayConstructor |
  Int16ArrayConstructor |
  Uint16ArrayConstructor |
  Int32ArrayConstructor |
  Uint32ArrayConstructor |
  BigInt64ArrayConstructor |
  BigUint64ArrayConstructor |
  Float32ArrayConstructor |
  Float64ArrayConstructor |
  DataViewConstructor |
  BufferCtor

declare interface ArrayBufferPointer {
  address: void_p
  ownership: Ownership
  runtimeAllocated: 0 | 1
}

declare interface MemoryViewDescriptor extends ArrayBufferPointer {
  Ctor: ViewConstuctor
  length: number
}

declare interface ViewPointer<T extends ArrayBufferView> extends ArrayBufferPointer {
  view: T
}

const emnapiExternalMemory: {
  registry: FinalizationRegistry<number> | undefined
  table: WeakMap<ArrayBuffer, ArrayBufferPointer>
  wasmMemoryViewTable: WeakMap<ArrayBufferView, MemoryViewDescriptor>
  init: () => void
  isDetachedArrayBuffer: (arrayBuffer: ArrayBufferLike) => boolean
  getOrUpdateMemoryView: <T extends ArrayBufferView>(view: T) => T
  getArrayBufferPointer: (arrayBuffer: ArrayBuffer, shouldCopy: boolean) => ArrayBufferPointer
  getViewPointer: <T extends ArrayBufferView>(view: T, shouldCopy: boolean) => ViewPointer<T>
} = {
  registry: typeof FinalizationRegistry === 'function' ? new FinalizationRegistry(function (_pointer) { _free($to64('_pointer') as number) }) : undefined,
  table: new WeakMap(),
  wasmMemoryViewTable: new WeakMap(),

  init: function () {
    emnapiExternalMemory.registry = typeof FinalizationRegistry === 'function' ? new FinalizationRegistry(function (_pointer) { _free($to64('_pointer') as number) }) : undefined
    emnapiExternalMemory.table = new WeakMap()
    emnapiExternalMemory.wasmMemoryViewTable = new WeakMap()
  },

  isDetachedArrayBuffer: function (arrayBuffer: ArrayBufferLike): boolean {
    if (arrayBuffer.byteLength === 0) {
      try {
        // eslint-disable-next-line no-new
        new Uint8Array(arrayBuffer)
      } catch (_) {
        return true
      }
    }
    return false
  },

  getArrayBufferPointer: function (arrayBuffer: ArrayBuffer, shouldCopy: boolean): ArrayBufferPointer {
    const info: ArrayBufferPointer = {
      address: 0,
      ownership: Ownership.kRuntime,
      runtimeAllocated: 0
    }
    if (arrayBuffer === wasmMemory.buffer) {
      return info
    }

    const isDetached = emnapiExternalMemory.isDetachedArrayBuffer(arrayBuffer)
    if (emnapiExternalMemory.table.has(arrayBuffer)) {
      const cachedInfo = emnapiExternalMemory.table.get(arrayBuffer)!
      if (isDetached) {
        cachedInfo.address = 0
        return cachedInfo
      }
      if (shouldCopy && cachedInfo.ownership === Ownership.kRuntime && cachedInfo.runtimeAllocated === 1) {
        new Uint8Array(wasmMemory.buffer).set(new Uint8Array(arrayBuffer), cachedInfo.address)
      }
      return cachedInfo
    }

    if (isDetached || (arrayBuffer.byteLength === 0)) {
      return info
    }

    if (!shouldCopy) {
      return info
    }

    const pointer = $makeMalloc('$emnapiExternalMemory.getArrayBufferPointer', 'arrayBuffer.byteLength')
    if (!pointer) throw new Error('Out of memory')
    new Uint8Array(wasmMemory.buffer).set(new Uint8Array(arrayBuffer), pointer)

    info.address = pointer
    info.ownership = emnapiExternalMemory.registry ? Ownership.kRuntime : Ownership.kUserland
    info.runtimeAllocated = 1

    emnapiExternalMemory.table.set(arrayBuffer, info)
    emnapiExternalMemory.registry?.register(arrayBuffer, pointer)
    return info
  },

  getOrUpdateMemoryView: function<T extends ArrayBufferView> (view: T): T {
    if (view.buffer === wasmMemory.buffer) {
      if (!emnapiExternalMemory.wasmMemoryViewTable.has(view)) {
        emnapiExternalMemory.wasmMemoryViewTable.set(view, {
          Ctor: view.constructor as any,
          address: view.byteOffset,
          length: view instanceof DataView ? view.byteLength : (view as any).length,
          ownership: Ownership.kUserland,
          runtimeAllocated: 0
        })
      }
      return view
    }

    const maybeOldWasmMemory = emnapiExternalMemory.isDetachedArrayBuffer(view.buffer) ||
      ((typeof SharedArrayBuffer === 'function') && (view.buffer instanceof SharedArrayBuffer))
    if (maybeOldWasmMemory && emnapiExternalMemory.wasmMemoryViewTable.has(view)) {
      const info = emnapiExternalMemory.wasmMemoryViewTable.get(view)!
      const Ctor = info.Ctor
      let newView: ArrayBufferView
      const Buffer = emnapiCtx.feature.Buffer
      if (typeof Buffer === 'function' && Ctor === Buffer) {
        newView = Buffer.from(wasmMemory.buffer, info.address, info.length)
      } else {
        newView = new Ctor(wasmMemory.buffer, info.address, info.length)
      }
      emnapiExternalMemory.wasmMemoryViewTable.set(newView, info)
      return newView as unknown as T
    }

    return view
  },

  getViewPointer: function<T extends ArrayBufferView> (view: T, shouldCopy: boolean): ViewPointer<T> {
    view = emnapiExternalMemory.getOrUpdateMemoryView(view)
    if (view.buffer === wasmMemory.buffer) {
      if (emnapiExternalMemory.wasmMemoryViewTable.has(view)) {
        const { address, ownership, runtimeAllocated } = emnapiExternalMemory.wasmMemoryViewTable.get(view)!
        return { address, ownership, runtimeAllocated, view }
      }
      return { address: view.byteOffset, ownership: Ownership.kUserland, runtimeAllocated: 0, view }
    }

    const { address, ownership, runtimeAllocated } = emnapiExternalMemory.getArrayBufferPointer(view.buffer, shouldCopy)
    return { address: address === 0 ? 0 : (address + view.byteOffset), ownership, runtimeAllocated, view }
  }
}

emnapiDefineVar(
  '$emnapiExternalMemory',
  emnapiExternalMemory,
  ['malloc', 'free', '$emnapiInit'],
  'emnapiExternalMemory.init();'
)
