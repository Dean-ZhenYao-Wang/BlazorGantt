var domHelpers = require("../utils/dom_helpers");

var isHeadless = require("../../../utils/is_headless");

module.exports = function (gantt) {
  var scrollRange = 50,
      scrollStep = 30,
      scrollDelay = 10,
      scrollSpeed = 50;
  var interval = null,
      isMove = false,
      delayTimeout = null,
      startPos = {
    started: false
  },
      eventPos = {};

  function isDisplayed(element) {
    return element && domHelpers.isChildOf(element, gantt.$root) && element.offsetHeight;
  }

  function getAutoscrollContainer() {
    var element;

    if (isDisplayed(gantt.$task)) {
      element = gantt.$task;
    } else if (isDisplayed(gantt.$grid)) {
      element = gantt.$grid;
    } else {
      element = gantt.$root;
    }

    return element;
  }

  function isScrollState() {
    var dragMarker = !!document.querySelector(".gantt_drag_marker");
    var isResize = !!document.querySelector(".gantt_drag_marker.gantt_grid_resize_area") || !!document.querySelector(".gantt_drag_marker.gantt_row_grid_resize_area");
    var isLink = !!document.querySelector(".gantt_link_direction");
    var state = gantt.getState();
    var isClickDrag = state.autoscroll;
    isMove = dragMarker && !isResize && !isLink;
    return !(!state.drag_mode && !dragMarker || isResize) || isClickDrag;
  }

  function defineDelayTimeout(state) {
    if (delayTimeout) {
      clearTimeout(delayTimeout);
      delayTimeout = null;
    }

    if (state) {
      var speed = gantt.config.autoscroll_speed;
      if (speed && speed < 10) // limit speed value to 10
        speed = 10;
      delayTimeout = setTimeout(function () {
        interval = setInterval(tick, speed || scrollSpeed);
      }, gantt.config.autoscroll_delay || scrollDelay);
    }
  }

  function defineScrollInterval(state) {
    if (state) {
      defineDelayTimeout(true);

      if (!startPos.started) {
        startPos.x = eventPos.x;
        startPos.y = eventPos.y;
        startPos.started = true;
      }
    } else {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }

      defineDelayTimeout(false);
      startPos.started = false;
    }
  }

  function autoscrollInterval(event) {
    var isScroll = isScrollState();

    if ((interval || delayTimeout) && !isScroll) {
      defineScrollInterval(false);
    }

    if (!gantt.config.autoscroll || !isScroll) {
      return false;
    }

    eventPos = {
      x: event.clientX,
      y: event.clientY
    }; // if it is a mobile device, we need to detect the touch event coords

    if (event.type == "touchmove") {
      eventPos.x = event.targetTouches[0].clientX;
      eventPos.y = event.targetTouches[0].clientY;
    }

    if (!interval && isScroll) {
      defineScrollInterval(true);
    }
  }

  function tick() {
    if (!isScrollState()) {
      defineScrollInterval(false);
      return false;
    }

    var container = getAutoscrollContainer();

    if (!container) {
      return;
    } // GS-1150: if we reorder or resize something in the grid, we should obtain the grid container


    var gridDrag = false;
    var gridMarkers = [".gantt_drag_marker.gantt_grid_resize_area", ".gantt_drag_marker .gantt_row.gantt_row_task", ".gantt_drag_marker.gantt_grid_dnd_marker"];
    gridMarkers.forEach(function (selector) {
      gridDrag = gridDrag || !!document.querySelector(selector);
    });

    if (gridDrag) {
      container = gantt.$grid;
    }

    var box = domHelpers.getNodePosition(container);
    var posX = eventPos.x - box.x;
    var posY = eventPos.y - box.y + window.scrollY; // GS-1315: window.scrollY here and below for the elements above Gantt

    var scrollLeft = isMove ? 0 : need_scroll(posX, box.width, startPos.x - box.x);
    var scrollTop = need_scroll(posY, box.height, startPos.y - box.y + window.scrollY);
    var scrollState = gantt.getScrollState();
    var currentScrollTop = scrollState.y,
        scrollOuterHeight = scrollState.inner_height,
        scrollInnerHeight = scrollState.height,
        currentScrollLeft = scrollState.x,
        scrollOuterWidth = scrollState.inner_width,
        scrollInnerWidth = scrollState.width; // do scrolling only if we have scrollable area to do so

    if (scrollTop && !scrollOuterHeight) {
      scrollTop = 0;
    } else if (scrollTop < 0 && !currentScrollTop) {
      scrollTop = 0;
    } else if (scrollTop > 0 && currentScrollTop + scrollOuterHeight >= scrollInnerHeight + 2) {
      scrollTop = 0;
    }

    if (scrollLeft && !scrollOuterWidth) {
      scrollLeft = 0;
    } else if (scrollLeft < 0 && !currentScrollLeft) {
      scrollLeft = 0;
    } else if (scrollLeft > 0 && currentScrollLeft + scrollOuterWidth >= scrollInnerWidth) {
      scrollLeft = 0;
    }

    var step = gantt.config.autoscroll_step;
    if (step && step < 2) // limit step value to 2
      step = 2;
    scrollLeft = scrollLeft * (step || scrollStep);
    scrollTop = scrollTop * (step || scrollStep);

    if (scrollLeft || scrollTop) {
      scroll(scrollLeft, scrollTop);
    }
  }

  function need_scroll(pos, boxSize, startCoord) {
    if (pos - scrollRange < 0 && pos < startCoord) return -1;else if (pos > boxSize - scrollRange && pos > startCoord) return 1;
    return 0;
  }

  function scroll(left, top) {
    var scrollState = gantt.getScrollState();
    var scrollLeft = null,
        scrollTop = null;

    if (left) {
      scrollLeft = scrollState.x + left;
      scrollLeft = Math.min(scrollState.width, scrollLeft);
      scrollLeft = Math.max(0, scrollLeft);
    }

    if (top) {
      scrollTop = scrollState.y + top;
      scrollTop = Math.min(scrollState.height, scrollTop);
      scrollTop = Math.max(0, scrollTop);
    }

    gantt.scrollTo(scrollLeft, scrollTop);
  }

  gantt.attachEvent("onGanttReady", function () {
    if (!isHeadless(gantt)) {
      var eventElement = domHelpers.getRootNode(gantt.$root) || document.body;
      gantt.eventRemove(eventElement, "mousemove", autoscrollInterval);
      gantt.event(eventElement, "mousemove", autoscrollInterval);
      gantt.eventRemove(eventElement, "touchmove", autoscrollInterval);
      gantt.event(eventElement, "touchmove", autoscrollInterval);
      gantt.eventRemove(eventElement, "pointermove", autoscrollInterval);
      gantt.event(eventElement, "pointermove", autoscrollInterval);
    }
  });
  gantt.attachEvent("onDestroy", function () {
    defineScrollInterval(false);
  });
};