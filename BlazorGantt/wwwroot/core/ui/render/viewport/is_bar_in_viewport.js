// optimized checker for task bars smart rendering
// first check the vertical position since it's easier to calculate
module.exports = function isBarInViewport(item, viewport, view, config, gantt) {
  if (!item.start_date || !item.end_date) {
    return null;
  }

  var top = view.getItemTop(item.id);
  var height = view.getItemHeight(item.id);

  if (top > viewport.y_end || top + height < viewport.y) {
    return false;
  }

  var padding = 200;
  var startCoord = view.posFromDate(item.start_date);
  var endCoord = view.posFromDate(item.end_date);
  var left = Math.min(startCoord, endCoord) - padding;
  var right = Math.max(startCoord, endCoord) + padding;

  if (left > viewport.x_end || right < viewport.x) {
    return false;
  }

  return true;
};