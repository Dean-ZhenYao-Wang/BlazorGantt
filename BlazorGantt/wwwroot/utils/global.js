/* eslint-disable no-restricted-globals */
var globalScope;

if (typeof window !== "undefined") {
  globalScope = window;
} else {
  globalScope = global;
}
/* eslint-enable no-restricted-globals */


module.exports = globalScope;