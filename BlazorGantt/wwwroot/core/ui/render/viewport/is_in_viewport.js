module.exports = function (viewport, box) {
  if (!box) {
    return false;
  }

  if (box.left > viewport.x_end || box.left + box.width < viewport.x) {
    return false;
  }

  if (box.top > viewport.y_end || box.top + box.height < viewport.y) {
    return false;
  }

  return true;
};