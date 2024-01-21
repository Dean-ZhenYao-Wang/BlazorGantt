var isLegacyRender = require("../is_legacy_smart_render");

module.exports = function isColumnVisible(columnIndex, scale, viewPort, gantt) {
  var width = scale.width[columnIndex];

  if (width <= 0) {
    return false;
  }

  if (!gantt.config.smart_rendering || isLegacyRender(gantt)) {
    return true;
  }

  var cellLeftCoord = scale.left[columnIndex] - width;
  var cellRightCoord = scale.left[columnIndex] + width;
  return cellLeftCoord <= viewPort.x_end && cellRightCoord >= viewPort.x; //do not render skipped columns
};