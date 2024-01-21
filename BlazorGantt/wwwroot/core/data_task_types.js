function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

module.exports = function (gantt) {
  gantt.getTaskType = function (type) {
    var checkType = type;

    if (type && _typeof(type) == "object") {
      checkType = type.type;
    }

    for (var i in this.config.types) {
      if (this.config.types[i] == checkType) {
        return checkType;
      }
    }

    return gantt.config.types.task;
  };
};