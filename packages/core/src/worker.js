export function handleMessage (e, callback) {
  if (e && e.data && e.data.__emnapi__) {
    const type = e.data.__emnapi__.type
    const payload = e.data.__emnapi__.payload
    callback(type, payload)
  }
}
