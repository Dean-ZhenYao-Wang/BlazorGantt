// optimized checker for links smart rendering
// first check the vertical position since it's easier to calculate
module.exports = function isLinkInViewPort(item, viewport, view, config, gantt) {
  var source = view.$gantt.getTask(item.source);
  var target = view.$gantt.getTask(item.target); // check vertical visibility first since it's a lighter check

  var sourceTop = view.getItemTop(source.id);
  var sourceHeight = view.getItemHeight(source.id);
  var targetTop = view.getItemTop(target.id);
  var targetHeight = view.getItemHeight(target.id);

  if (viewport.y > sourceTop + sourceHeight && viewport.y > targetTop + targetHeight) {
    return false;
  }

  if (viewport.y_end < targetTop && viewport.y_end < sourceTop) {
    return false;
  }

  var padding = 100;
  var sourceLeft = view.posFromDate(source.start_date);
  var sourceRight = view.posFromDate(source.end_date);
  var targetLeft = view.posFromDate(target.start_date);
  var targetRight = view.posFromDate(target.end_date);

  if (sourceLeft > sourceRight) {
    // rtl
    var tmp = sourceRight;
    sourceRight = sourceLeft;
    sourceLeft = tmp;
  }

  if (targetLeft > targetRight) {
    // rtl
    var tmp = targetRight;
    targetRight = targetLeft;
    targetLeft = tmp;
  }

  sourceLeft += -padding; // add buffer for custom elements

  sourceRight += padding;
  targetLeft += -padding; // add buffer for custom elements

  targetRight += padding;

  if (viewport.x > sourceRight && viewport.x > targetRight) {
    return false;
  }

  if (viewport.x_end < sourceLeft && viewport.x_end < targetLeft) {
    return false;
  }

  return true;
};