var getRowRectangle = require("./viewport/get_grid_row_rectangle");

var getVisibleRange = require("./viewport/get_visible_bars_range");

function createGridTaskRowResizerRender(gantt) {
  function _render_grid_item(item, view, viewport) {
    var config = view.$getConfig();
    var resize_el = document.createElement("div");
    resize_el.className = "gantt_task_grid_row_resize_wrap";
    resize_el.style.top = view.getItemTop(item.id) + view.getItemHeight(item.id) + "px";
    resize_el.innerHTML = "<div class='gantt_task_grid_row_resize' role='cell'></div>";
    resize_el.setAttribute(config.task_grid_row_resizer_attribute, item.id);

    gantt._waiAria.rowResizerAttr(resize_el);

    return resize_el;
  }

  return {
    render: _render_grid_item,
    update: null,
    getRectangle: getRowRectangle,
    getVisibleRange: getVisibleRange
  };
}

module.exports = createGridTaskRowResizerRender;