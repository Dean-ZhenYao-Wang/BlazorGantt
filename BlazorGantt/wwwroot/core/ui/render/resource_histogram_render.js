var getRectangle = require("./viewport/get_bg_row_rectangle");

var getVisibleRange = require("./viewport/get_visible_bars_range");

var getVisibleCellsRange = require("./viewport/get_visible_cells_range");

var isColumnVisible = require("./viewport/is_column_visible");

var resourceTimetable = require("../../resource_timetable_builder");

function renderBar(level, start, end, timeline) {
  var top = (1 - (level * 1 || 0)) * 100;
  var left = timeline.posFromDate(start);
  var right = timeline.posFromDate(end);
  var element = document.createElement("div");
  element.className = "gantt_histogram_hor_bar";
  element.style.top = top + '%';
  element.style.left = left + "px";
  element.style.width = right - left + 1 + "px";
  return element;
}

function renderConnection(prevLevel, nextLevel, left) {
  if (prevLevel === nextLevel) {
    return null;
  }

  var top = 1 - Math.max(prevLevel, nextLevel);
  var height = Math.abs(prevLevel - nextLevel);
  var element = document.createElement("div");
  element.className = "gantt_histogram_vert_bar";
  element.style.top = top * 100 + "%";
  element.style.height = height * 100 + "%";
  element.style.left = left + "px";
  return element;
}

function generateRenderResourceHistogram(gantt) {
  var getResourceLoad = resourceTimetable(gantt);
  var renderedHistogramCells = {};
  var renderedHistogramRows = {};
  var renderedHistogramCapacity = {};

  function detachRenderedHistogramCell(id, index) {
    var renderedRow = renderedHistogramCells[id];

    if (renderedRow && renderedRow[index] && renderedRow[index].parentNode) {
      renderedRow[index].parentNode.removeChild(renderedRow[index]);
    }
  }

  function renderHistogramLine(capacity, timeline, maxCapacity, viewport) {
    var scale = timeline.getScale();
    var el = document.createElement("div");
    var range = getVisibleCellsRange(scale, viewport);

    for (var i = range.start; i <= range.end; i++) {
      var colStart = scale.trace_x[i];
      var colEnd = scale.trace_x[i + 1] || gantt.date.add(colStart, scale.step, scale.unit);
      var col = scale.trace_x[i].valueOf();
      var level = Math.min(capacity[col] / maxCapacity, 1) || 0; // do not render histogram for lines with below zero capacity, as it's reserved for folders

      if (level < 0) {
        return null;
      }

      var nextLevel = Math.min(capacity[colEnd.valueOf()] / maxCapacity, 1) || 0;
      var bar = renderBar(level, colStart, colEnd, timeline);

      if (bar) {
        el.appendChild(bar);
      }

      var connection = renderConnection(level, nextLevel, timeline.posFromDate(colEnd));

      if (connection) {
        el.appendChild(connection);
      }
    }

    return el;
  }

  function renderCapacityElement(resource, sizes, capacityMatrix, config, timeline, maxCapacity, viewport) {
    var renderedElement = renderedHistogramCapacity[resource.id];

    if (renderedElement && renderedElement.parentNode) {
      renderedElement.parentNode.removeChild(renderedElement);
    }

    var capacityElement = renderHistogramLine(capacityMatrix, timeline, maxCapacity, viewport);

    if (capacityElement && sizes) {
      capacityElement.setAttribute("data-resource-id", resource.id);
      capacityElement.setAttribute(timeline.$config.item_attribute, resource.id);
      capacityElement.style.position = "absolute";
      capacityElement.style.top = sizes.top + 1 + "px";
      capacityElement.style.height = timeline.getItemHeight(resource.id) - 1 + "px";
      capacityElement.style.left = 0;
    }

    return capacityElement;
  }

  function renderHistogramCell(resource, sizes, maxCapacity, config, templates, day, timeline) {
    var css = templates.histogram_cell_class(day.start_date, day.end_date, resource, day.tasks, day.assignments);
    var content = templates.histogram_cell_label(day.start_date, day.end_date, resource, day.tasks, day.assignments);
    var fill = templates.histogram_cell_allocated(day.start_date, day.end_date, resource, day.tasks, day.assignments);
    var height = timeline.getItemHeight(resource.id) - 1;

    if (css || content) {
      var el = document.createElement('div');
      el.className = ["gantt_histogram_cell", css].join(" ");
      el.setAttribute(timeline.$config.item_attribute, resource.id);
      el.style.cssText = ['left:' + sizes.left + 'px', 'width:' + sizes.width + 'px', 'height:' + height + 'px', 'line-height:' + height + 'px', 'top:' + (sizes.top + 1) + 'px'].join(";");

      if (content) {
        content = "<div class='gantt_histogram_label'>" + content + "</div>";
      }

      if (fill) {
        content = "<div class='gantt_histogram_fill' style='height:" + Math.min(fill / maxCapacity || 0, 1) * 100 + "%;'></div>" + content;
      }

      if (content) {
        el.innerHTML = content;
      }

      return el;
    }

    return null;
  }

  function renderResourceHistogram(resource, timeline, config, viewport) {
    var templates = timeline.$getTemplates();
    var scale = timeline.getScale();
    var timetable = getResourceLoad(resource, config.resource_property, scale, timeline);
    var cells = [];
    var capacityMatrix = {};
    var maxCapacity = resource.capacity || timeline.$config.capacity || 24;
    renderedHistogramCells[resource.id] = {};
    renderedHistogramRows[resource.id] = null;
    renderedHistogramCapacity[resource.id] = null;
    var smartRendering = !!viewport; //no viewport means smart rendering is disabled

    var range = getVisibleCellsRange(scale, viewport);

    for (var columnIndex = range.start; columnIndex <= range.end; columnIndex++) {
      var day = timetable[columnIndex];

      if (!day) {
        continue;
      }

      if (smartRendering && !isColumnVisible(columnIndex, scale, viewport, gantt)) {
        continue;
      }

      var capacity = templates.histogram_cell_capacity(day.start_date, day.end_date, resource, day.tasks, day.assignments);
      capacityMatrix[day.start_date.valueOf()] = capacity || 0;
      var sizes = timeline.getItemPosition(resource, day.start_date, day.end_date);
      var el = renderHistogramCell(resource, sizes, maxCapacity, config, templates, day, timeline);

      if (el) {
        cells.push(el);
        renderedHistogramCells[resource.id][columnIndex] = el;
      }
    }

    var row = null;

    if (cells.length) {
      row = document.createElement("div");

      for (var i = 0; i < cells.length; i++) {
        row.appendChild(cells[i]);
      }

      var capacityElement = renderCapacityElement(resource, sizes, capacityMatrix, config, timeline, maxCapacity, viewport);

      if (capacityElement) {
        row.appendChild(capacityElement);
        renderedHistogramCapacity[resource.id] = capacityElement;
      }

      renderedHistogramRows[resource.id] = row;
    }

    return row;
  }

  function updateResourceHistogram(resource, node, timeline, config, viewport) {
    var templates = timeline.$getTemplates();
    var scale = timeline.getScale();
    var timetable = getResourceLoad(resource, config.resource_property, scale, timeline);
    var maxCapacity = resource.capacity || timeline.$config.capacity || 24;
    var capacityMatrix = {};
    var smartRendering = !!viewport; //no viewport means smart rendering is disabled

    var range = getVisibleCellsRange(scale, viewport);
    var checkedColumns = {};

    if (renderedHistogramCells && renderedHistogramCells[resource.id]) {
      for (var i in renderedHistogramCells[resource.id]) {
        checkedColumns[i] = i;
      }
    }

    for (var columnIndex = range.start; columnIndex <= range.end; columnIndex++) {
      var day = timetable[columnIndex];
      checkedColumns[columnIndex] = false;

      if (!day) {
        continue;
      }

      var capacity = templates.histogram_cell_capacity(day.start_date, day.end_date, resource, day.tasks, day.assignments);
      capacityMatrix[day.start_date.valueOf()] = capacity || 0;
      var sizes = timeline.getItemPosition(resource, day.start_date, day.end_date);

      if (smartRendering && !isColumnVisible(columnIndex, scale, viewport, gantt)) {
        detachRenderedHistogramCell(resource.id, columnIndex);
        continue;
      }

      var renderedCell = renderedHistogramCells[resource.id];

      if (!renderedCell || !renderedCell[columnIndex]) {
        var el = renderHistogramCell(resource, sizes, maxCapacity, config, templates, day, timeline);

        if (el) {
          node.appendChild(el);
          renderedHistogramCells[resource.id][columnIndex] = el;
        }
      } else if (renderedCell && renderedCell[columnIndex] && !renderedCell[columnIndex].parentNode) {
        node.appendChild(renderedCell[columnIndex]);
      }
    }

    for (var i in checkedColumns) {
      if (checkedColumns[i] !== false) {
        detachRenderedHistogramCell(resource.id, i);
      }
    }

    var capacityElement = renderCapacityElement(resource, sizes, capacityMatrix, config, timeline, maxCapacity, viewport);

    if (capacityElement) {
      node.appendChild(capacityElement);
      renderedHistogramCapacity[resource.id] = capacityElement;
    }
  }

  return {
    render: renderResourceHistogram,
    update: updateResourceHistogram,
    getRectangle: getRectangle,
    getVisibleRange: getVisibleRange
  };
}

module.exports = generateRenderResourceHistogram;