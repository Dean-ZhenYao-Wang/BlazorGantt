var barRectangle = require("./get_bar_rectangle");

module.exports = function getLinkBox(item, view, config, gantt) {
  if (!gantt.isTaskExists(item.source)) {
    return null;
  }

  if (!gantt.isTaskExists(item.target)) {
    return null;
  }

  var sourceBox = barRectangle(gantt.getTask(item.source), view, gantt);
  var targetBox = barRectangle(gantt.getTask(item.target), view, gantt);

  if (!sourceBox || !targetBox) {
    return null;
  }

  var padding = 100;
  var left = Math.min(sourceBox.left, targetBox.left) - padding;
  var right = Math.max(sourceBox.left + sourceBox.width, targetBox.left + targetBox.width) + padding;
  var top = Math.min(sourceBox.top, targetBox.top) - padding;
  var bottom = Math.max(sourceBox.top + sourceBox.height, targetBox.top + targetBox.height) + padding;
  return {
    top: top,
    height: bottom - top,
    bottom: bottom,
    left: left,
    width: right - left,
    right: right
  };
};