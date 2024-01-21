var isBarInViewport = require("./is_bar_in_viewport");

module.exports = function isSplitTaskInViewport(item, viewport, view, config, gantt) {
  if (!gantt.isSplitTask(item)) {
    return false;
  }

  var range = gantt.getSubtaskDates(item.id);
  return isBarInViewport({
    id: item.id,
    start_date: range.start_date,
    end_date: range.end_date,
    parent: item.parent
  }, viewport, view, gantt);
};