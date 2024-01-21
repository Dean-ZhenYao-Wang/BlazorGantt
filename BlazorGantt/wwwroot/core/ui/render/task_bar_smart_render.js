var isInViewPort = require("./viewport/is_bar_in_viewport");

var getVisibleRange = require("./viewport/get_visible_bars_range");

var createBaseBarRender = require("./task_bar_render");

module.exports = function createTaskRenderer(gantt) {
  var defaultRender = createBaseBarRender(gantt);
  return {
    render: defaultRender,
    update: null,
    //getRectangle: getBarRectangle
    isInViewPort: isInViewPort,
    getVisibleRange: getVisibleRange
  };
};