module.exports = function getVisibleCellsRange(scale, viewport) {
  var firstCellIndex = 0;
  var lastCellIndex = scale.left.length - 1;

  if (viewport) {
    for (var i = 0; i < scale.left.length; i++) {
      var left = scale.left[i];

      if (left < viewport.x) {
        firstCellIndex = i;
      }

      if (left > viewport.x_end) {
        lastCellIndex = i;
        break;
      }
    }
  }

  return {
    start: firstCellIndex,
    end: lastCellIndex
  };
};