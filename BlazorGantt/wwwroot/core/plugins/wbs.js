var createWbs = function createWbs(gantt) {
  return {
    _needRecalc: true,
    reset: function reset() {
      this._needRecalc = true;
    },
    _isRecalcNeeded: function _isRecalcNeeded() {
      return !this._isGroupSort() && this._needRecalc;
    },
    _isGroupSort: function _isGroupSort() {
      return !!gantt.getState().group_mode;
    },
    _getWBSCode: function _getWBSCode(task) {
      if (!task) return "";

      if (this._isRecalcNeeded()) {
        this._calcWBS();
      }

      if (task.$virtual) return "";
      if (this._isGroupSort()) return task.$wbs || "";

      if (!task.$wbs) {
        this.reset();

        this._calcWBS();
      }

      return task.$wbs;
    },
    _setWBSCode: function _setWBSCode(task, value) {
      task.$wbs = value;
    },
    getWBSCode: function getWBSCode(task) {
      return this._getWBSCode(task);
    },
    getByWBSCode: function getByWBSCode(code) {
      var parts = code.split(".");
      var currentNode = gantt.config.root_id;

      for (var i = 0; i < parts.length; i++) {
        var children = gantt.getChildren(currentNode);
        var index = parts[i] * 1 - 1;

        if (gantt.isTaskExists(children[index])) {
          currentNode = children[index];
        } else {
          return null;
        }
      }

      if (gantt.isTaskExists(currentNode)) {
        return gantt.getTask(currentNode);
      } else {
        return null;
      }
    },
    _calcWBS: function _calcWBS() {
      if (!this._isRecalcNeeded()) return;
      var _isFirst = true;
      gantt.eachTask(function (ch) {
        if (_isFirst) {
          _isFirst = false;

          this._setWBSCode(ch, "1");

          return;
        }

        var _prevSibling = gantt.getPrevSibling(ch.id);

        if (_prevSibling !== null) {
          var _wbs = gantt.getTask(_prevSibling).$wbs;

          if (_wbs) {
            _wbs = _wbs.split(".");
            _wbs[_wbs.length - 1]++;

            this._setWBSCode(ch, _wbs.join("."));
          }
        } else {
          var _parent = gantt.getParent(ch.id);

          this._setWBSCode(ch, gantt.getTask(_parent).$wbs + ".1");
        }
      }, gantt.config.root_id, this);
      this._needRecalc = false;
    }
  };
};

module.exports = function (gantt) {
  var wbs = createWbs(gantt);

  gantt.getWBSCode = function getWBSCode(task) {
    return wbs.getWBSCode(task);
  };

  gantt.getTaskByWBSCode = function (code) {
    return wbs.getByWBSCode(code);
  };

  function resetCache() {
    wbs.reset();
    return true;
  }

  gantt.attachEvent("onAfterTaskMove", resetCache);
  gantt.attachEvent("onBeforeParse", resetCache);
  gantt.attachEvent("onAfterTaskDelete", resetCache);
  gantt.attachEvent("onAfterTaskAdd", resetCache);
  gantt.attachEvent("onAfterSort", resetCache);
};