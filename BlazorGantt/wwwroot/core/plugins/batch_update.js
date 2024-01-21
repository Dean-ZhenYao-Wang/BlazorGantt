var global = require("../../utils/global");

function createMethod(gantt) {
  var methods = {};
  var isActive = false;

  function disableMethod(methodName, dummyMethod) {
    dummyMethod = typeof dummyMethod == "function" ? dummyMethod : function () {};

    if (!methods[methodName]) {
      methods[methodName] = this[methodName];
      this[methodName] = dummyMethod;
    }
  }

  function restoreMethod(methodName) {
    if (methods[methodName]) {
      this[methodName] = methods[methodName];
      methods[methodName] = null;
    }
  }

  function disableMethods(methodsHash) {
    for (var i in methodsHash) {
      disableMethod.call(this, i, methodsHash[i]);
    }
  }

  function restoreMethods() {
    for (var i in methods) {
      restoreMethod.call(this, i);
    }
  }

  function batchUpdatePayload(callback) {
    try {
      callback();
    } catch (e) {
      global.console.error(e);
    }
  }

  var state = gantt.$services.getService("state");
  state.registerProvider("batchUpdate", function () {
    return {
      batch_update: isActive
    };
  }, false);
  return function batchUpdate(callback, noRedraw) {
    if (isActive) {
      // batch mode is already active
      batchUpdatePayload(callback);
      return;
    }

    var call_dp = this._dp && this._dp.updateMode != "off";
    var dp_mode;

    if (call_dp) {
      dp_mode = this._dp.updateMode;

      this._dp.setUpdateMode("off");
    } // temporary disable some methods while updating multiple tasks


    var resetProjects = {};
    var methods = {
      "render": true,
      "refreshData": true,
      "refreshTask": true,
      "refreshLink": true,
      "resetProjectDates": function resetProjectDates(task) {
        resetProjects[task.id] = task;
      }
    };
    disableMethods.call(this, methods);
    isActive = true;
    this.callEvent("onBeforeBatchUpdate", []);
    batchUpdatePayload(callback);
    this.callEvent("onAfterBatchUpdate", []);
    restoreMethods.call(this); // do required updates after changes applied

    for (var i in resetProjects) {
      this.resetProjectDates(resetProjects[i]);
    }

    isActive = false;

    if (!noRedraw) {
      this.render();
    }

    if (call_dp) {
      this._dp.setUpdateMode(dp_mode);

      this._dp.setGanttMode("task");

      this._dp.sendData();

      this._dp.setGanttMode("link");

      this._dp.sendData();
    }
  };
}

module.exports = function (gantt) {
  gantt.batchUpdate = createMethod(gantt);
};