var domHelpers = require("../utils/dom_helpers");

function createRowResizer(gantt, grid) {
  var _task_grid_row_resize = {
    row_before_start: gantt.bind(function (dnd, obj, e) {
      var config = grid.$getConfig();
      var store = grid.$config.rowStore;
      var el = domHelpers.locateAttribute(e, config.task_grid_row_resizer_attribute);
      if (!el) return false;
      var row_id = this.locate(e, config.task_grid_row_resizer_attribute),
          row = store.getItem(row_id);
      if (grid.callEvent("onBeforeRowResize", [row]) === false) return false;
    }, gantt),
    row_after_start: gantt.bind(function (dnd, obj, e) {
      var config = grid.$getConfig();
      var row_id = this.locate(e, config.task_grid_row_resizer_attribute);
      dnd.config.marker.innerHTML = "";
      dnd.config.marker.className += " gantt_row_grid_resize_area";
      dnd.config.marker.style.width = grid.$grid.offsetWidth + "px";
      dnd.config.drag_id = row_id;
    }, gantt),
    row_drag_move: gantt.bind(function (dnd, obj, e) {
      var store = grid.$config.rowStore;
      var config = grid.$getConfig();
      var dd = dnd.config;
      var id = dd.drag_id,
          itemHeight = grid.getItemHeight(id),
          itemTop = grid.getItemTop(id);
      var pos = domHelpers.getNodePosition(grid.$grid_data),
          pointerPosition = parseInt(dd.marker.style.top, 10),
          markerStartPosition = itemTop + pos.y,
          marker_height = 0,
          minPointerPosition = config.min_task_grid_row_height;
      marker_height = pointerPosition - markerStartPosition;

      if (marker_height < minPointerPosition) {
        marker_height = minPointerPosition;
      }

      dd.marker.style.left = pos.x + "px";
      dd.marker.style.top = markerStartPosition - 1 + "px";
      dd.marker.style.height = Math.abs(marker_height) + 1 + "px";
      dd.marker_height = marker_height;
      grid.callEvent("onRowResize", [id, store.getItem(id), marker_height + itemHeight]);
      return true;
    }, gantt),
    row_drag_end: gantt.bind(function (dnd, obj, e) {
      var store = grid.$config.rowStore;
      var dd = dnd.config;
      var id = dd.drag_id,
          item = store.getItem(id),
          oldItemHeight = grid.getItemHeight(id);
      var finalHeight = dd.marker_height;
      if (grid.callEvent("onBeforeRowResizeEnd", [id, item, finalHeight]) === false) return;
      if (item.row_height == finalHeight) return;
      item.row_height = finalHeight;
      gantt.updateTask(id);
      grid.callEvent("onAfterRowResize", [id, item, oldItemHeight, finalHeight]);
      this.render();
    }, gantt)
  }; // calls the initialization of the D'n'D events for resize elements

  var _init_resize = function _init_resize() {
    var DnD = gantt.$services.getService("dnd");
    var config = grid.$getConfig();
    var dnd = new DnD(grid.$grid_data, {
      updates_per_second: 60
    });
    if (gantt.defined(config.dnd_sensitivity)) dnd.config.sensitivity = config.dnd_sensitivity;
    dnd.attachEvent("onBeforeDragStart", function (obj, e) {
      return _task_grid_row_resize.row_before_start(dnd, obj, e);
    });
    dnd.attachEvent("onAfterDragStart", function (obj, e) {
      return _task_grid_row_resize.row_after_start(dnd, obj, e);
    });
    dnd.attachEvent("onDragMove", function (obj, e) {
      return _task_grid_row_resize.row_drag_move(dnd, obj, e);
    });
    dnd.attachEvent("onDragEnd", function (obj, e) {
      return _task_grid_row_resize.row_drag_end(dnd, obj, e);
    });
  };

  return {
    init: _init_resize
  };
}

module.exports = createRowResizer;