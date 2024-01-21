var createBaseBarRender = require("./task_bar_render"); //const isInViewPort = require("./viewport/is_split_task_in_viewport");


var getVisibleRange = require("./viewport/get_visible_bars_range");

var isInViewPortParent = require("./viewport/is_split_task_in_viewport");

var isInViewPortChild = require("./viewport/is_bar_in_viewport");

function createTaskRenderer(gantt) {
  var defaultRender = createBaseBarRender(gantt);
  var renderedNodes = {};

  function checkVisibility(child, viewPort, timeline, config, gantt) {
    var isVisible = !child.hide_bar; // GS-1195. Don't render split tasks that are outside the viewport

    if (config.smart_rendering && isVisible) {
      isVisible = isInViewPortChild(child, viewPort, timeline, config, gantt);
    }

    return isVisible;
  }

  function generateChildElement(task, child, timeline, sizes) {
    if (child.hide_bar) {
      return;
    }

    var isProject = gantt.isSummaryTask(child);

    if (isProject) {
      gantt.resetProjectDates(child);
    }

    var childCopy = gantt.copy(gantt.getTask(child.id));
    childCopy.$rendered_at = task.id; // a way to filter split tasks:

    var showSplitTask = gantt.callEvent("onBeforeSplitTaskDisplay", [childCopy.id, childCopy, task.id]);

    if (showSplitTask === false) {
      return;
    }

    var element = defaultRender(childCopy, timeline);
    if (!element) return;
    var height = timeline.getBarHeight(task.id, child.type == gantt.config.types.milestone);
    var padding = Math.floor((timeline.getItemHeight(task.id) - height) / 2);
    element.style.top = sizes.top + padding + "px";
    element.classList.add("gantt_split_child");

    if (isProject) {
      element.classList.add("gantt_split_subproject");
    }

    return element;
  }

  function getKey(childId, renderParentId) {
    return childId + "_" + renderParentId;
  }

  function shouldUseSplitRendering(task, config) {
    return gantt.isSplitTask(task) && (config.open_split_tasks && !task.$open || !config.open_split_tasks) && gantt.hasChild(task.id);
  }

  function renderSplitTask(task, timeline, config, viewPort) {
    if (shouldUseSplitRendering(task, config)) {
      var el = document.createElement('div'),
          sizes = gantt.getTaskPosition(task);

      if (gantt.hasChild(task.id)) {
        gantt.eachTask(function (child) {
          var isVisible = checkVisibility(child, viewPort, timeline, config, gantt);

          if (!isVisible) {
            return;
          }

          var element = generateChildElement(task, child, timeline, sizes);

          if (element) {
            renderedNodes[getKey(child.id, task.id)] = element;
            el.appendChild(element);
          } else {
            renderedNodes[getKey(child.id, task.id)] = false;
          }
        }, task.id);
      }

      return el;
    }

    return false;
  }

  function repaintSplitTask(task, itemNode, timeline, config, viewPort) {
    if (shouldUseSplitRendering(task, config)) {
      var el = document.createElement("div"),
          sizes = gantt.getTaskPosition(task);
      gantt.eachTask(function (child) {
        var splitKey = getKey(child.id, task.id);
        var isVisible = checkVisibility(child, viewPort, timeline, config, gantt);

        if (isVisible !== !!renderedNodes[splitKey]) {
          if (isVisible) {
            var element = generateChildElement(task, child, timeline, sizes);
            renderedNodes[splitKey] = element || false;
          } else {
            renderedNodes[splitKey] = false;
          }
        }

        if (!!renderedNodes[splitKey]) {
          el.appendChild(renderedNodes[splitKey]);
        }

        itemNode.innerHTML = "";
        itemNode.appendChild(el);
      }, task.id);
    }
  }

  return {
    render: renderSplitTask,
    update: repaintSplitTask,
    isInViewPort: isInViewPortParent,
    getVisibleRange: getVisibleRange
  };
}

module.exports = createTaskRenderer;