var createBaseBarRender = require("./task_bar_render");

var isInViewPort = require("./viewport/is_bar_in_viewport");

var getVisibleRange = require("./viewport/get_visible_bars_range");

function createTaskRenderer(gantt) {
  var defaultRender = createBaseBarRender(gantt);
  var renderedNodes = {};

  function checkVisibility(child, viewPort, timeline, config, gantt) {
    var isVisible = true; // GS-2123. Don't render rollup tasks that are outside the viewport

    if (config.smart_rendering) {
      isVisible = isInViewPort(child, viewPort, timeline, config, gantt);
    }

    return isVisible;
  }

  function generateChildElement(task, child, timeline, sizes) {
    var childCopy = gantt.copy(gantt.getTask(child.id));
    childCopy.$rendered_at = task.id; // a way to filter rollup tasks:

    var displayRollup = gantt.callEvent("onBeforeRollupTaskDisplay", [childCopy.id, childCopy, task.id]);

    if (displayRollup === false) {
      return;
    }

    var element = defaultRender(childCopy, timeline);

    if (!element) {
      return;
    }

    var height = timeline.getBarHeight(task.id, child.type == gantt.config.types.milestone);
    var padding = Math.floor((timeline.getItemHeight(task.id) - height) / 2);
    element.style.top = sizes.top + padding + "px";
    element.classList.add("gantt_rollup_child");
    element.setAttribute("data-rollup-parent-id", task.id);
    return element;
  }

  function getKey(childId, renderParentId) {
    return childId + "_" + renderParentId;
  }

  function renderRollupTask(task, timeline, config, viewPort) {
    if (task.rollup !== false && task.$rollup && task.$rollup.length) {
      var el = document.createElement('div'),
          sizes = gantt.getTaskPosition(task); // vertical position is not important for the rollup tasks as long as the parent is rendered

      viewPort.y = 0;
      viewPort.y_end = gantt.$task_bg.scrollHeight;
      task.$rollup.forEach(function (itemId) {
        if (!gantt.isTaskExists(itemId)) {
          return;
        }

        var child = gantt.getTask(itemId);
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
      });
      return el;
    }

    return false;
  }

  function repaintRollupTask(task, itemNode, timeline, config, viewPort) {
    var el = document.createElement("div"),
        sizes = gantt.getTaskPosition(task); // vertical position is not important for the rollup tasks as long as the parent is rendered

    viewPort.y = 0;
    viewPort.y_end = gantt.$task_bg.scrollHeight;
    task.$rollup.forEach(function (itemId) {
      var child = gantt.getTask(itemId);
      var rollupKey = getKey(child.id, task.id);
      var isVisible = checkVisibility(child, viewPort, timeline, config, gantt);

      if (isVisible !== !!renderedNodes[rollupKey]) {
        if (isVisible) {
          var element = generateChildElement(task, child, timeline, sizes);
          renderedNodes[rollupKey] = element || false;
        } else {
          renderedNodes[rollupKey] = false;
        }
      }

      if (!!renderedNodes[rollupKey]) {
        el.appendChild(renderedNodes[rollupKey]);
      }

      itemNode.innerHTML = "";
      itemNode.appendChild(el);
    });
  }

  return {
    render: renderRollupTask,
    update: repaintRollupTask,
    //getRectangle: getBarRectangle
    isInViewPort: isInViewPort,
    getVisibleRange: getVisibleRange
  };
}

module.exports = createTaskRenderer;