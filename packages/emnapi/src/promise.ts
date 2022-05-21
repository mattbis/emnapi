function napi_create_promise (env: napi_env, deferred: Pointer<napi_deferred>, promise: Pointer<napi_value>): napi_status {
  return emnapi.preamble(env, (envObject) => {
    return emnapi.checkArgs(envObject, [deferred, promise], () => {
      const p = new Promise<any>((resolve, reject) => {
        const deferredObject = emnapi.Deferred.create<any>(envObject, { resolve, reject })
        HEAP32[deferred >> 2] = deferredObject.id
      })
      HEAP32[promise >> 2] = envObject.getCurrentScope().add(p).id
      return envObject.getReturnStatus()
    })
  })
}

function napi_resolve_deferred (env: napi_env, deferred: napi_deferred, resolution: napi_value): napi_status {
  return emnapi.preamble(env, (envObject) => {
    return emnapi.checkArgs(envObject, [deferred, resolution], () => {
      const deferredObject = envObject.deferredStore.get(deferred)!
      deferredObject.resolve(envObject.handleStore.get(resolution)!.value)
      return envObject.getReturnStatus()
    })
  })
}

function napi_reject_deferred (env: napi_env, deferred: napi_deferred, resolution: napi_value): napi_status {
  return emnapi.preamble(env, (envObject) => {
    return emnapi.checkArgs(envObject, [deferred, resolution], () => {
      const deferredObject = envObject.deferredStore.get(deferred)!
      deferredObject.reject(envObject.handleStore.get(resolution)!.value)
      return envObject.getReturnStatus()
    })
  })
}

function napi_is_promise (env: napi_env, value: napi_value, is_promise: Pointer<bool>): napi_status {
  return emnapi.checkEnv(env, (envObject) => {
    return emnapi.checkArgs(envObject, [value, is_promise], () => {
      try {
        const h = envObject.handleStore.get(value)!
        HEAPU8[is_promise] = h.isPromise() ? 1 : 0
      } catch (err) {
        envObject.tryCatch.setError(err)
        return envObject.setLastError(napi_status.napi_pending_exception)
      }
      return envObject.clearLastError()
    })
  })
}

emnapiImplement('napi_create_promise', napi_create_promise)
emnapiImplement('napi_resolve_deferred', napi_resolve_deferred)
emnapiImplement('napi_reject_deferred', napi_reject_deferred)
emnapiImplement('napi_is_promise', napi_is_promise)
