function addResizeListener(gantt) {
  var containerStyles = window.getComputedStyle(gantt.$root);

  if (containerStyles.getPropertyValue("position") == "static") {
    gantt.$root.style.position = "relative";
  }

  var resizeWatcher = document.createElement('iframe');
  resizeWatcher.className = "gantt_container_resize_watcher";
  resizeWatcher.tabIndex = -1;

  if (gantt.config.wai_aria_attributes) {
    resizeWatcher.setAttribute("role", "none");
    resizeWatcher.setAttribute("aria-hidden", true);
  }

  var salesforce_environment = !!window["Sfdc"] || !!window["$A"] || window["Aura"];

  if (salesforce_environment) {
    gantt.config.container_resize_method = "timeout";
  } // in some environments (namely, in SalesForce) iframe.contentWindow is not available


  gantt.$root.appendChild(resizeWatcher);

  if (resizeWatcher.contentWindow) {
    listenWindowResize(gantt, resizeWatcher.contentWindow);
  } else {
    // if so - ditch the iframe and fallback to listening the main window resize
    gantt.$root.removeChild(resizeWatcher);
    listenWindowResize(gantt, window);
  }
}

function listenWindowResize(gantt, window) {
  var resizeTimeout = gantt.config.container_resize_timeout || 20;
  var resizeDelay;

  if (gantt.config.container_resize_method == "timeout") {
    lowlevelResizeWatcher();
  } else {
    try {
      gantt.event(window, "resize", function () {
        if (gantt.$scrollbarRepaint) {
          gantt.$scrollbarRepaint = null;
        } else {
          repaintGantt();
        }
      });
    } catch (e) {
      lowlevelResizeWatcher();
    }
  }

  function repaintGantt() {
    clearTimeout(resizeDelay);
    resizeDelay = setTimeout(function () {
      if (!gantt.$destroyed) {
        gantt.render();
      }
    }, resizeTimeout);
  }

  var previousHeight = gantt.$root.offsetHeight;
  var previousWidth = gantt.$root.offsetWidth;

  function lowlevelResizeWatcher() {
    if (gantt.$root.offsetHeight != previousHeight || gantt.$root.offsetWidth != previousWidth) {
      repaintGantt();
    }

    previousHeight = gantt.$root.offsetHeight;
    previousWidth = gantt.$root.offsetWidth;
    setTimeout(lowlevelResizeWatcher, resizeTimeout);
  }
}

module.exports = addResizeListener;