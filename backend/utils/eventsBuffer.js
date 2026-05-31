const MAX = 100;
const buffer = [];

function push(event, payload = {}, message = '') {
  buffer.unshift({
    event,
    message,
    payload,
    time: new Date().toISOString(),
  });
  if (buffer.length > MAX) buffer.length = MAX;
}

function list(limit = MAX) {
  return buffer.slice(0, Math.min(limit, MAX));
}

module.exports = { push, list, MAX };
