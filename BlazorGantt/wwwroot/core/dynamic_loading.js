module.exports = function (gantt) {
  var TreeDataStore = require("./datastore/treedatastore");

  var loadedBranches = {};
  gantt.attachEvent("onClearAll", function () {
    loadedBranches = {};
  });
  var oldHasChildren = TreeDataStore.prototype.hasChild;

  gantt.$data.tasksStore.hasChild = function (id) {
    if (!gantt.config.branch_loading) {
      return oldHasChildren.call(this, id);
    } else {
      if (oldHasChildren.call(this, id)) return true;

      if (this.exists(id)) {
        return this.getItem(id)[gantt.config.branch_loading_property];
      }
    }

    return false;
  };

  function needLoading(id) {
    if (gantt.config.branch_loading && gantt._load_url) {
      var alreadyLoaded = !!loadedBranches[id]; // call ajax only if branch has children

      if (!alreadyLoaded && !gantt.getChildren(id).length && gantt.hasChild(id)) {
        return true;
      }
    }

    return false;
  }

  gantt.attachEvent("onTaskOpened", function (id) {
    if (gantt.config.branch_loading && gantt._load_url) {
      // call ajax only if branch has children
      if (needLoading(id)) {
        var url = gantt._load_url;
        url = url.replace(/(\?|&)?parent_id=.+&?/, "");
        var param = url.indexOf("?") >= 0 ? "&" : "?";
        var y = gantt.getScrollState().y || 0;
        var requestData = {
          taskId: id,
          url: url + param + "parent_id=" + encodeURIComponent(id)
        };

        if (gantt.callEvent("onBeforeBranchLoading", [requestData]) === false) {
          return;
        }

        gantt.load(requestData.url, this._load_type, function () {
          if (y) {
            gantt.scrollTo(null, y);
          }

          gantt.callEvent("onAfterBranchLoading", [requestData]);
        });
        loadedBranches[id] = true;
      }
    }
  });
};