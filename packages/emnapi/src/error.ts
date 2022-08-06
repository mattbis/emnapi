function napi_get_last_error_info (env: napi_env, result: Pointer<Pointer<napi_extended_error_info>>): napi_status {
  return emnapi.checkEnv(env, (envObject) => {
    return emnapi.checkArgs(envObject, [result], () => {
      const error_code = envObject.lastError.getErrorCode()
      envObject.lastError.setErrorMessage(getValue(errorMessagesPtr! + error_code * POINTER_SIZE, '*'))

      if (error_code === napi_status.napi_ok) {
        envObject.clearLastError()
      }
      // #if MEMORY64
      result = Number(result)
      // #endif
      setValue(result, envObject.lastError.data, '*')
      return napi_status.napi_ok
    })
  })
}

function napi_throw (env: napi_env, error: napi_value): napi_status {
  return emnapi.preamble(env, (envObject) => {
    return emnapi.checkArgs(envObject, [error], () => {
      envObject.tryCatch.setError(emnapi.handleStore.get(error)!.value)
      return envObject.clearLastError()
    })
  })
}

function napi_throw_error (env: napi_env, code: const_char_p, msg: const_char_p): napi_status {
  return emnapi.preamble(env, (envObject) => {
    if (!msg) return envObject.setLastError(napi_status.napi_invalid_arg)
    const error: Error & { code?: string } = new Error(UTF8ToString(Number(msg)))
    if (code) {
      error.code = UTF8ToString(Number(code))
    }
    envObject.tryCatch.setError(error)
    return envObject.clearLastError()
  })
}

function napi_throw_type_error (env: napi_env, code: const_char_p, msg: const_char_p): napi_status {
  return emnapi.preamble(env, (envObject) => {
    if (!msg) return envObject.setLastError(napi_status.napi_invalid_arg)
    const error: TypeError & { code?: string } = new TypeError(UTF8ToString(Number(msg)))
    if (code) {
      error.code = UTF8ToString(Number(code))
    }
    envObject.tryCatch.setError(error)
    return envObject.clearLastError()
  })
}

function napi_throw_range_error (env: napi_env, code: const_char_p, msg: const_char_p): napi_status {
  return emnapi.preamble(env, (envObject) => {
    if (!msg) return envObject.setLastError(napi_status.napi_invalid_arg)
    const error: RangeError & { code?: string } = new RangeError(UTF8ToString(Number(msg)))
    if (code) {
      error.code = UTF8ToString(Number(code))
    }
    envObject.tryCatch.setError(error)
    return envObject.clearLastError()
  })
}

function node_api_throw_syntax_error (env: napi_env, code: const_char_p, msg: const_char_p): napi_status {
  return emnapi.preamble(env, (envObject) => {
    if (!msg) return envObject.setLastError(napi_status.napi_invalid_arg)
    const error: SyntaxError & { code?: string } = new SyntaxError(UTF8ToString(Number(msg)))
    if (code) {
      error.code = UTF8ToString(Number(code))
    }
    envObject.tryCatch.setError(error)
    return envObject.clearLastError()
  })
}

function napi_is_exception_pending (env: napi_env, result: Pointer<bool>): napi_status {
  return emnapi.checkEnv(env, (envObject) => {
    return emnapi.checkArgs(envObject, [result], () => {
      const r = envObject.tryCatch.hasCaught()
      HEAPU8[Number(result)] = r ? 1 : 0
      return envObject.clearLastError()
    })
  })
}

function napi_create_error (env: napi_env, code: napi_value, msg: napi_value, result: Pointer<napi_value>): napi_status {
  return emnapi.checkEnv(env, (envObject) => {
    return emnapi.checkArgs(envObject, [msg, result], () => {
      const msgValue = emnapi.handleStore.get(msg)!.value
      if (typeof msgValue !== 'string') {
        return envObject.setLastError(napi_status.napi_string_expected)
      }

      const error = new Error(msgValue)
      const status = emnapiSetErrorCode(envObject, error, code, NULL)
      if (status !== napi_status.napi_ok) return status
      setValue(Number(result), emnapi.addToCurrentScope(envObject, error).id, '*')
      return envObject.clearLastError()
    })
  })
}

function napi_create_type_error (env: napi_env, code: napi_value, msg: napi_value, result: Pointer<napi_value>): napi_status {
  return emnapi.checkEnv(env, (envObject) => {
    return emnapi.checkArgs(envObject, [msg, result], () => {
      const msgValue = emnapi.handleStore.get(msg)!.value
      if (typeof msgValue !== 'string') {
        return envObject.setLastError(napi_status.napi_string_expected)
      }
      const error = new TypeError(msgValue)
      const status = emnapiSetErrorCode(envObject, error, code, NULL)
      if (status !== napi_status.napi_ok) return status
      setValue(Number(result), emnapi.addToCurrentScope(envObject, error).id, '*')
      return envObject.clearLastError()
    })
  })
}

function napi_create_range_error (env: napi_env, code: napi_value, msg: napi_value, result: Pointer<napi_value>): napi_status {
  return emnapi.checkEnv(env, (envObject) => {
    return emnapi.checkArgs(envObject, [msg, result], () => {
      const msgValue = emnapi.handleStore.get(msg)!.value
      if (typeof msgValue !== 'string') {
        return envObject.setLastError(napi_status.napi_string_expected)
      }
      const error = new RangeError(msgValue)
      const status = emnapiSetErrorCode(envObject, error, code, NULL)
      if (status !== napi_status.napi_ok) return status
      setValue(Number(result), emnapi.addToCurrentScope(envObject, error).id, '*')
      return envObject.clearLastError()
    })
  })
}

function node_api_create_syntax_error (env: napi_env, code: napi_value, msg: napi_value, result: Pointer<napi_value>): napi_status {
  return emnapi.checkEnv(env, (envObject) => {
    return emnapi.checkArgs(envObject, [msg, result], () => {
      const msgValue = emnapi.handleStore.get(msg)!.value
      if (typeof msgValue !== 'string') {
        return envObject.setLastError(napi_status.napi_string_expected)
      }
      const error = new SyntaxError(msgValue)
      const status = emnapiSetErrorCode(envObject, error, code, NULL)
      if (status !== napi_status.napi_ok) return status
      setValue(Number(result), emnapi.addToCurrentScope(envObject, error).id, '*')
      return envObject.clearLastError()
    })
  })
}

function napi_get_and_clear_last_exception (env: napi_env, result: Pointer<napi_value>): napi_status {
  return emnapi.checkEnv(env, (envObject) => {
    return emnapi.checkArgs(envObject, [result], () => {
      if (!envObject.tryCatch.hasCaught()) {
        setValue(Number(result), emnapi.HandleStore.ID_UNDEFINED, '*')
        return envObject.clearLastError()
      } else {
        const err = envObject.tryCatch.exception()!
        setValue(Number(result), envObject.ensureHandleId(err), '*')
        envObject.tryCatch.reset()
      }
      return envObject.clearLastError()
    })
  })
}

function napi_fatal_error (location: const_char_p, location_len: size_t, message: const_char_p, message_len: size_t): void {
  // #if MEMORY64
  location = Number(location)
  location_len = Number(location_len)
  message = Number(message)
  message_len = Number(message_len)
  // #endif
  abort('FATAL ERROR: ' + (location_len === -1 ? UTF8ToString(location) : UTF8ToString(location, location_len)) + ' ' + (message_len === -1 ? UTF8ToString(message) : UTF8ToString(message, message_len)))
}

emnapiImplement('napi_get_last_error_info', napi_get_last_error_info, ['$errorMessagesPtr', '$POINTER_SIZE'])
emnapiImplement('napi_get_and_clear_last_exception', napi_get_and_clear_last_exception)
emnapiImplement('napi_throw', napi_throw)
emnapiImplement('napi_throw_error', napi_throw_error)
emnapiImplement('napi_throw_type_error', napi_throw_type_error)
emnapiImplement('napi_throw_range_error', napi_throw_range_error)
emnapiImplement('node_api_throw_syntax_error', node_api_throw_syntax_error)
emnapiImplement('napi_create_error', napi_create_error, ['$emnapiSetErrorCode'])
emnapiImplement('napi_create_type_error', napi_create_type_error, ['$emnapiSetErrorCode'])
emnapiImplement('napi_create_range_error', napi_create_range_error, ['$emnapiSetErrorCode'])
emnapiImplement('node_api_create_syntax_error', node_api_create_syntax_error, ['$emnapiSetErrorCode'])
emnapiImplement('napi_is_exception_pending', napi_is_exception_pending)
emnapiImplement('napi_fatal_error', napi_fatal_error)
