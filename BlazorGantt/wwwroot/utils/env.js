/* eslint-disable no-restricted-globals */
var isWindowAwailable = typeof window !== "undefined";
/* eslint-enable no-restricted-globals */

var env = {
  isIE: isWindowAwailable && (navigator.userAgent.indexOf("MSIE") >= 0 || navigator.userAgent.indexOf("Trident") >= 0),
  isIE6: isWindowAwailable && !XMLHttpRequest && navigator.userAgent.indexOf("MSIE") >= 0,
  isIE7: isWindowAwailable && navigator.userAgent.indexOf("MSIE 7.0") >= 0 && navigator.userAgent.indexOf("Trident") < 0,
  isIE8: isWindowAwailable && navigator.userAgent.indexOf("MSIE 8.0") >= 0 && navigator.userAgent.indexOf("Trident") >= 0,
  isOpera: isWindowAwailable && navigator.userAgent.indexOf("Opera") >= 0,
  isChrome: isWindowAwailable && navigator.userAgent.indexOf("Chrome") >= 0,
  isKHTML: isWindowAwailable && (navigator.userAgent.indexOf("Safari") >= 0 || navigator.userAgent.indexOf("Konqueror") >= 0),
  isFF: isWindowAwailable && navigator.userAgent.indexOf("Firefox") >= 0,
  isIPad: isWindowAwailable && navigator.userAgent.search(/iPad/gi) >= 0,
  isEdge: isWindowAwailable && navigator.userAgent.indexOf("Edge") != -1,
  isNode: !isWindowAwailable || typeof navigator == "undefined"
};
module.exports = env;