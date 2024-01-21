module.exports = function (item, view, config) {
  if (!item.start_date || !item.end_date) {
    return null;
  }

  var padding = 200;
  var startCoord = view.posFromDate(item.start_date);
  var endCoord = view.posFromDate(item.end_date);
  var left = Math.min(startCoord, endCoord) - padding;
  var right = Math.max(startCoord, endCoord) + padding;
  return {
    top: view.getItemTop(item.id),
    height: view.getItemHeight(item.id),
    left: left,
    width: right - left
  };
};