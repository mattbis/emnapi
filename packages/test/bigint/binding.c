#include <limits.h>
// #include <inttypes.h>
#if !defined(__wasm__) || (defined(__EMSCRIPTEN__) || defined(__wasi__))
#include <stdio.h>
#endif
#include <js_native_api.h>
#include "../common.h"

static napi_value IsLossless(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value args[2];
  NAPI_CALL(env, napi_get_cb_info(env, info, &argc, args, NULL, NULL));

  bool is_signed;
  NAPI_CALL(env, napi_get_value_bool(env, args[1], &is_signed));

  bool lossless;

  if (is_signed) {
    int64_t input;
    NAPI_CALL(env, napi_get_value_bigint_int64(env, args[0], &input, &lossless));
  } else {
    uint64_t input;
    NAPI_CALL(env, napi_get_value_bigint_uint64(env, args[0], &input, &lossless));
  }

  napi_value output;
  NAPI_CALL(env, napi_get_boolean(env, lossless, &output));

  return output;
}

static napi_value TestInt64(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  NAPI_CALL(env, napi_get_cb_info(env, info, &argc, args, NULL, NULL));

  NAPI_ASSERT(env, argc >= 1, "Wrong number of arguments");

  napi_valuetype valuetype0;
  NAPI_CALL(env, napi_typeof(env, args[0], &valuetype0));

  NAPI_ASSERT(env, valuetype0 == napi_bigint,
      "Wrong type of arguments. Expects a bigint as first argument.");

  int64_t input;
  bool lossless;
  NAPI_CALL(env, napi_get_value_bigint_int64(env, args[0], &input, &lossless));

  napi_value output;
  NAPI_CALL(env, napi_create_bigint_int64(env, input, &output));

  return output;
}

static napi_value TestUint64(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  NAPI_CALL(env, napi_get_cb_info(env, info, &argc, args, NULL, NULL));

  NAPI_ASSERT(env, argc >= 1, "Wrong number of arguments");

  napi_valuetype valuetype0;
  NAPI_CALL(env, napi_typeof(env, args[0], &valuetype0));

  NAPI_ASSERT(env, valuetype0 == napi_bigint,
      "Wrong type of arguments. Expects a bigint as first argument.");

  uint64_t input;
  bool lossless;
  NAPI_CALL(env, napi_get_value_bigint_uint64(
        env, args[0], &input, &lossless));

  napi_value output;
  NAPI_CALL(env, napi_create_bigint_uint64(env, input, &output));

  return output;
}

static napi_value TestWords(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  NAPI_CALL(env, napi_get_cb_info(env, info, &argc, args, NULL, NULL));

  NAPI_ASSERT(env, argc >= 1, "Wrong number of arguments");

  napi_valuetype valuetype0;
  NAPI_CALL(env, napi_typeof(env, args[0], &valuetype0));

  NAPI_ASSERT(env, valuetype0 == napi_bigint,
      "Wrong type of arguments. Expects a bigint as first argument.");

  size_t expected_word_count;
  NAPI_CALL(env, napi_get_value_bigint_words(
        env, args[0], NULL, &expected_word_count, NULL));

  int sign_bit;
  size_t word_count = 10;
  uint64_t words[10];

  NAPI_CALL(env, napi_get_value_bigint_words(
        env, args[0], &sign_bit, &word_count, words));
#if !defined(__wasm__) || (defined(__EMSCRIPTEN__) || defined(__wasi__))
  printf("[");
  for (size_t i = 0; i < word_count; i++) {
    if (i == 0) {
      printf("%llu", words[i]);
    } else {
      printf(", %llu", words[i]);
    }
  }
  printf("]\n");
#endif
  NAPI_ASSERT(env, word_count == expected_word_count,
      "word counts do not match");

  napi_value output;
  NAPI_CALL(env, napi_create_bigint_words(
        env, sign_bit, word_count, words, &output));

  return output;
}

// throws RangeError
static napi_value CreateTooBigBigInt(napi_env env, napi_callback_info info) {
  int sign_bit = 0;
  size_t word_count = SIZE_MAX;
  uint64_t words[10];

  napi_value output;

  NAPI_CALL(env, napi_create_bigint_words(
        env, sign_bit, word_count, words, &output));

  return output;
}

// Test that we correctly forward exceptions from the engine.
static napi_value MakeBigIntWordsThrow(napi_env env, napi_callback_info info) {
  uint64_t words[10];
  napi_value output;

  napi_status status = napi_create_bigint_words(env,
                                                0,
                                                INT_MAX,
                                                words,
                                                &output);
  if (status != napi_pending_exception)
    napi_throw_error(env, NULL, "Expected status `napi_pending_exception`");

  return NULL;
}

EXTERN_C_START
napi_value Init(napi_env env, napi_value exports) {
  napi_property_descriptor descriptors[] = {
    DECLARE_NAPI_PROPERTY("IsLossless", IsLossless),
    DECLARE_NAPI_PROPERTY("TestInt64", TestInt64),
    DECLARE_NAPI_PROPERTY("TestUint64", TestUint64),
    DECLARE_NAPI_PROPERTY("TestWords", TestWords),
    DECLARE_NAPI_PROPERTY("CreateTooBigBigInt", CreateTooBigBigInt),
    DECLARE_NAPI_PROPERTY("MakeBigIntWordsThrow", MakeBigIntWordsThrow),
  };

  NAPI_CALL(env, napi_define_properties(
      env, exports, sizeof(descriptors) / sizeof(*descriptors), descriptors));

  return exports;
}
EXTERN_C_END
