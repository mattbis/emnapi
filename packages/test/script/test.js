const { spawnSync } = require('child_process')
const glob = require('glob')

const cwd = require('path').join(__dirname, '..')

const files = glob.sync('**/*.test.js', {
  cwd,
  ignore: process.env.EMNAPI_TEST_NATIVE
    ? ['**/{emnapitest,tsfn,node-addon-api}/**/*']
    : process.env.MEMORY64
      ? [
          'async/**/*',
          'pool/**/*',
          'tsfn/**/*'
        ]
      : []
})
// const files = ['tsfn/tsfn.test.js']

files.forEach((f) => {
  test(f)
})

function test (f) {
  const r = spawnSync('node', ['--expose-gc', ...(process.env.MEMORY64 ? ['--experimental-wasm-memory64'] : []), './script/test-entry.js', f], { cwd, env: process.env, stdio: 'inherit' })
  if (r.status !== 0) {
    process.exit(r.status)
  }
  console.log()
}
