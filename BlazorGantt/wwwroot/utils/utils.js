function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var helpers = require("./helpers");

var plainObjectConstructor = {}.constructor.toString();

function isCustomType(object) {
  var constructorString = object.constructor.toString();
  return constructorString !== plainObjectConstructor;
}

function copy(object) {
  var i, result; // iterator, types array, result

  if (object && _typeof(object) == "object") {
    switch (true) {
      case helpers.isDate(object):
        result = new Date(object);
        break;

      case helpers.isArray(object):
        result = new Array(object.length);

        for (i = 0; i < object.length; i++) {
          result[i] = copy(object[i]);
        }

        break;

      /*		case (helpers.isStringObject(object)):
      			result = new String(object);
      			break;
      		case (helpers.isNumberObject(object)):
      			result = new Number(object);
      			break;
      		case (helpers.isBooleanObject(object)):
      			result = new Boolean(object);
      			break;*/

      default:
        if (isCustomType(object)) {
          result = Object.create(object);
        } else {
          result = {};
        }

        for (i in object) {
          if (Object.prototype.hasOwnProperty.apply(object, [i])) result[i] = copy(object[i]);
        }

        break;
    }
  }

  return result || object;
}

function mixin(target, source, force) {
  for (var f in source) {
    if (target[f] === undefined || force) target[f] = source[f];
  }

  return target;
}

function defined(obj) {
  return typeof obj != "undefined";
}

var seed;

function uid() {
  if (!seed) seed = new Date().valueOf();
  seed++;
  return seed;
} //creates function with specified "this" pointer


function bind(functor, object) {
  if (functor.bind) return functor.bind(object);else return function () {
    return functor.apply(object, arguments);
  };
}

function event(el, event, handler, capture) {
  if (el.addEventListener) el.addEventListener(event, handler, capture === undefined ? false : capture);else if (el.attachEvent) el.attachEvent("on" + event, handler);
}

function eventRemove(el, event, handler, capture) {
  if (el.removeEventListener) el.removeEventListener(event, handler, capture === undefined ? false : capture);else if (el.detachEvent) el.detachEvent("on" + event, handler);
}

module.exports = {
  copy: copy,
  defined: defined,
  mixin: mixin,
  uid: uid,
  bind: bind,
  event: event,
  eventRemove: eventRemove
};