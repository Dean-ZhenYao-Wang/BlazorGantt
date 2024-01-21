var getLinkRectangle = require("../get_link_rectangle");

module.exports = function () {
  var coordinates = [];
  var calculated = false;

  function clearCache() {
    coordinates = [];
    calculated = false;
  }

  function buildCache(datastore, view, gantt) {
    var config = view.$getConfig();
    var visibleItems = datastore.getVisibleItems(); //datastore.eachItem(function(link){

    visibleItems.forEach(function (link) {
      var rec = getLinkRectangle(link, view, config, gantt);

      if (!rec) {
        return;
      }

      coordinates.push({
        id: link.id,
        rec: rec
      });
    });
    coordinates.sort(function (a, b) {
      if (a.rec.right < b.rec.right) {
        return -1;
      } else {
        return 1;
      }
    });
    calculated = true;
  }

  var initialized = false;

  function init(datastore) {
    if (initialized) {
      return;
    }

    initialized = true;
    datastore.attachEvent("onPreFilter", clearCache);
    datastore.attachEvent("onStoreUpdated", clearCache);
    datastore.attachEvent("onClearAll", clearCache);
    datastore.attachEvent("onBeforeStoreUpdate", clearCache);
  }

  return function getVisibleLinksRange(gantt, view, config, datastore, viewport) {
    init(datastore);

    if (!calculated) {
      buildCache(datastore, view, gantt);
    }

    var visibleBoxes = [];

    for (var i = 0; i < coordinates.length; i++) {
      var item = coordinates[i];
      var box = item.rec;

      if (box.right < viewport.x) {
        continue;
      }

      if (box.left < viewport.x_end && box.right > viewport.x && box.top < viewport.y_end && box.bottom > viewport.y) {
        visibleBoxes.push(item.id);
      }
    }

    return {
      ids: visibleBoxes
    };
  };
};