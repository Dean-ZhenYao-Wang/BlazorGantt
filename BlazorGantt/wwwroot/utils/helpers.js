function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var units = {
  "second": 1,
  "minute": 60,
  "hour": 60 * 60,
  "day": 60 * 60 * 24,
  "week": 60 * 60 * 24 * 7,
  "month": 60 * 60 * 24 * 30,
  "quarter": 60 * 60 * 24 * 30 * 3,
  "year": 60 * 60 * 24 * 365
};

function getSecondsInUnit(unit) {
  return units[unit] || units.hour;
}

function forEach(arr, callback) {
  if (arr.forEach) {
    arr.forEach(callback);
  } else {
    var workArray = arr.slice();

    for (var i = 0; i < workArray.length; i++) {
      callback(workArray[i], i);
    }
  }
}

function arrayMap(arr, callback) {
  if (arr.map) {
    return arr.map(callback);
  } else {
    var workArray = arr.slice();
    var resArray = [];

    for (var i = 0; i < workArray.length; i++) {
      resArray.push(callback(workArray[i], i));
    }

    return resArray;
  }
}

function arrayFind(arr, callback) {
  if (arr.find) {
    return arr.find(callback);
  } else {
    for (var i = 0; i < arr.length; i++) {
      if (callback(arr[i], i)) {
        return arr[i];
      }
    }
  }
}

function arrayIncludes(arr, item) {
  if (arr.includes) {
    return arr.includes(item);
  } else {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === item) {
        return true;
      }
    }

    return false;
  }
} // iframe-safe array type check instead of using instanceof


function isArray(obj) {
  if (Array.isArray) {
    return Array.isArray(obj);
  } else {
    // close enough
    return obj && obj.length !== undefined && obj.pop && obj.push;
  }
} // non-primitive string object, e.g. new String("abc")


function isStringObject(obj) {
  return obj && _typeof(obj) === "object" && Function.prototype.toString.call(obj.constructor) === "function String() { [native code] }";
} // non-primitive number object, e.g. new Number(5)


function isNumberObject(obj) {
  return obj && _typeof(obj) === "object" && Function.prototype.toString.call(obj.constructor) === "function Number() { [native code] }";
} // non-primitive number object, e.g. new Boolean(true)


function isBooleanObject(obj) {
  return obj && _typeof(obj) === "object" && Function.prototype.toString.call(obj.constructor) === "function Boolean() { [native code] }";
}

function isDate(obj) {
  if (obj && _typeof(obj) === "object") {
    return !!(obj.getFullYear && obj.getMonth && obj.getDate);
  } else {
    return false;
  }
}

function isValidDate(obj) {
  return isDate(obj) && !isNaN(obj.getTime());
}

function arrayFilter(arr, callback) {
  var result = [];

  if (arr.filter) {
    return arr.filter(callback);
  } else {
    for (var i = 0; i < arr.length; i++) {
      if (callback(arr[i], i)) {
        result[result.length] = arr[i];
      }
    }

    return result;
  }
}

function hashToArray(hash) {
  var result = [];

  for (var key in hash) {
    if (hash.hasOwnProperty(key)) {
      result.push(hash[key]);
    }
  }

  return result;
}

function arraySome(arr, callback) {
  if (arr.length === 0) return false;

  for (var i = 0; i < arr.length; i++) {
    if (callback(arr[i], i, arr)) {
      return true;
    }
  }

  return false;
}

function arrayDifference(arr, callback) {
  return arrayFilter(arr, function (item, i) {
    return !callback(item, i);
  });
}

function throttle(callback, timeout) {
  var wait = false;
  return function () {
    if (!wait) {
      callback.apply(null, arguments);
      wait = true;
      setTimeout(function () {
        wait = false;
      }, timeout);
    }
  };
}

function delay(callback, timeout) {
  var timer;

  var result = function result() {
    result.$cancelTimeout();
    result.$pending = true;
    var args = Array.prototype.slice.call(arguments);
    timer = setTimeout(function () {
      callback.apply(this, args);
      result.$pending = false;
    }, timeout);
  };

  result.$pending = false;

  result.$cancelTimeout = function () {
    clearTimeout(timer);
    result.$pending = false;
  };

  result.$execute = function () {
    var args = Array.prototype.slice.call(arguments);
    callback.apply(this, args);
    result.$cancelTimeout();
  };

  return result;
}

function sortArrayOfHash(arr, field, desc) {
  var compare = function compare(a, b) {
    return a < b;
  };

  arr.sort(function (a, b) {
    if (a[field] === b[field]) return 0;
    return desc ? compare(a[field], b[field]) : compare(b[field], a[field]);
  });
}

function objectKeys(obj) {
  if (Object.keys) {
    return Object.keys(obj);
  }

  var result = [];
  var key;

  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result.push(key);
    }
  }

  return result;
}

function isEventable(obj) {
  return obj.attachEvent && obj.detachEvent;
} //GS-1090: A task should be able to have the id = 0


function replaceValidZeroId(id, rootId) {
  if (checkZeroId(id) && !checkZeroId(rootId)) {
    id = "0";
  }

  return id;
}

function checkZeroId(id) {
  if (id === 0) {
    return true;
  }

  return false;
}

function findBinary(array, target) {
  // modified binary search, target value not exactly match array elements, looking for closest one
  var low = 0,
      high = array.length - 1,
      i,
      item,
      prev;

  while (low <= high) {
    i = Math.floor((low + high) / 2);
    item = +array[i];
    prev = +array[i - 1];

    if (item < target) {
      low = i + 1;
      continue;
    }

    if (item > target) {
      if (!(!isNaN(prev) && prev < target)) {
        high = i - 1;
        continue;
      } else {
        // if target is between 'i' and 'i-1' return 'i - 1'
        return i - 1;
      }
    }

    while (+array[i] == +array[i + 1]) {
      i++;
    }

    return i;
  }

  return array.length - 1;
}

module.exports = {
  getSecondsInUnit: getSecondsInUnit,
  forEach: forEach,
  arrayMap: arrayMap,
  arrayIncludes: arrayIncludes,
  arrayFind: arrayFind,
  arrayFilter: arrayFilter,
  arrayDifference: arrayDifference,
  arraySome: arraySome,
  hashToArray: hashToArray,
  sortArrayOfHash: sortArrayOfHash,
  throttle: throttle,
  isArray: isArray,
  isDate: isDate,
  isValidDate: isValidDate,
  isStringObject: isStringObject,
  isNumberObject: isNumberObject,
  isBooleanObject: isBooleanObject,
  delay: delay,
  objectKeys: objectKeys,
  isEventable: isEventable,
  replaceValidZeroId: replaceValidZeroId,
  checkZeroId: checkZeroId,
  findBinary: findBinary
};