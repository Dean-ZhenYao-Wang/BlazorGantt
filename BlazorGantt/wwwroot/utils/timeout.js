function checkTimeout(host, updPerSecond) {
  if (!updPerSecond) return true;
  if (host._on_timeout) return false;
  var timeout = Math.ceil(1000 / updPerSecond);
  if (timeout < 2) return true;
  setTimeout(function () {
    delete host._on_timeout;
  }, timeout);
  host._on_timeout = true;
  return true;
}

module.exports = checkTimeout;