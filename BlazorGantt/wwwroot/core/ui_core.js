module.exports = function (gantt) {
  var utils = require("../utils/utils");

  var env = require("../utils/env");

  var isHeadless = require("../utils/is_headless");

  if (!env.isNode) {
    var domHelpers = require("./ui/utils/dom_helpers");

    var codeHelpers = require("../utils/helpers");

    gantt.utils = {
      arrayFind: codeHelpers.arrayFind,
      dom: domHelpers
    };

    var domEvents = require("./ui/utils/dom_event_scope")();

    gantt.event = domEvents.attach;
    gantt.eventRemove = domEvents.detach;
    gantt._eventRemoveAll = domEvents.detachAll;
    gantt._createDomEventScope = domEvents.extend;
    utils.mixin(gantt, require("./ui/message")(gantt));

    var uiApi = require("./ui/index").init(gantt);

    gantt.$ui = uiApi.factory;
    gantt.$ui.layers = uiApi.render;
    gantt.$mouseEvents = uiApi.mouseEvents;
    gantt.$services.setService("mouseEvents", function () {
      return gantt.$mouseEvents;
    });
    gantt.mixin(gantt, uiApi.layersApi);

      require("./data_task_layers.gpl.js")(gantt);

    gantt.$services.setService("layers", function () {
      return uiApi.layersService;
    });

    var createLayoutFacade = require("./facades/layout");

    gantt.mixin(gantt, createLayoutFacade());

    require("./ui/skin")(gantt);

    require("../css/skins/skyblue")(gantt);

    require("../css/skins/meadow")(gantt);

    require("../css/skins/terrace")(gantt);

    require("../css/skins/broadway")(gantt);

    require("../css/skins/material")(gantt);

    require("../css/skins/contrast_black")(gantt);

    require("../css/skins/contrast_white")(gantt);

    require("./ui/plugins")(gantt);

    require("./ui/touch")(gantt);

    require("./ui/lightbox")(gantt);

    require("./ui/lightbox/lightbox_optional_time")(gantt);

    require("./ui/wai_aria")(gantt);

    gantt.locate = function (e) {
      var trg = domHelpers.getTargetNode(e); // ignore empty rows/cells of the timeline

      if (domHelpers.closest(trg, ".gantt_task_row")) {
        return null;
      }

      var targetAttribute = arguments[1] || this.config.task_attribute;
      var node = domHelpers.locateAttribute(trg, targetAttribute);

      if (node) {
        return node.getAttribute(targetAttribute);
      } else {
        return null;
      }
    };

    gantt._locate_css = function (e, classname, strict) {
      return domHelpers.locateClassName(e, classname, strict);
    };

    gantt._locateHTML = function (e, attribute) {
      return domHelpers.locateAttribute(e, attribute || this.config.task_attribute);
    };
  }

  gantt.attachEvent("onParse", function () {
    if (!isHeadless(gantt)) {
      gantt.attachEvent("onGanttRender", function () {
        if (gantt.config.initial_scroll) {
          var firstTask = gantt.getTaskByIndex(0);
          var id = firstTask ? firstTask.id : gantt.config.root_id; // GS-1450. Don't scroll to the task if there is no timeline

          if (gantt.isTaskExists(id) && gantt.$task && gantt.utils.dom.isChildOf(gantt.$task, gantt.$container)) {
            gantt.showTask(id);
          }
        }
      }, {
        once: true
      });
    }
  });
  gantt.attachEvent("onBeforeGanttReady", function () {
    if (!this.config.scroll_size) this.config.scroll_size = domHelpers.getScrollSize() || 1;

    if (!isHeadless(gantt)) {
      // detach listeners before clearing old DOM, possible IE errors when accessing detached nodes
      this._eventRemoveAll();

      this.$mouseEvents.reset();
      this.resetLightbox();
    }
  }); // GS-1261: scroll the views to the right side when RTL is enabled

  gantt.attachEvent("onGanttReady", function () {
    if (!isHeadless(gantt) && gantt.config.rtl) {
      gantt.$layout.getCellsByType("viewCell").forEach(function (cell) {
        var attachedScrollbar = cell.$config.scrollX;
        if (!attachedScrollbar) return;
        var scrollbar = gantt.$ui.getView(attachedScrollbar);
        if (scrollbar) scrollbar.scrollTo(scrollbar.$config.scrollSize, 0);
      });
    }
  }); // GS-1649: check if extensions are connected via files

  gantt.attachEvent("onGanttReady", function () {
    if (!isHeadless(gantt)) {
      var activePlugins = gantt.plugins();
      var availablePlugins = {
        auto_scheduling: gantt.autoSchedule,
        click_drag: gantt.ext.clickDrag,
        critical_path: gantt.isCriticalTask,
        drag_timeline: gantt.ext.dragTimeline,
        export_api: gantt.exportToPDF,
        fullscreen: gantt.ext.fullscreen,
        grouping: gantt.groupBy,
        keyboard_navigation: gantt.ext.keyboardNavigation,
        marker: gantt.addMarker,
        multiselect: gantt.eachSelectedTask,
        overlay: gantt.ext.overlay,
        quick_info: gantt.templates.quick_info_content,
        tooltip: gantt.ext.tooltips,
        undo: gantt.undo
      };

      for (var plugin in availablePlugins) {
        if (availablePlugins[plugin] && !activePlugins[plugin]) {
          // eslint-disable-next-line no-console
          console.warn("You connected the '".concat(plugin, "' extension via an obsolete file. \nTo fix it, you need to remove the obsolete file and connect the extension via the plugins method: https://docs.dhtmlx.com/gantt/api__gantt_plugins.html"));
        }
      }
    }
  });
};