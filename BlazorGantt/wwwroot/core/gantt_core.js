function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var domHelpers = require("./ui/utils/dom_helpers"),
    helpers = require("../utils/helpers");

var isHeadless = require("../utils/is_headless");

var addResizeListener = require("./ui/resize_listener");

module.exports = function (gantt) {
  var calculateScaleRange = require("./gantt_data_range");

  gantt.assert = require("./common/assert")(gantt);

  function isHTMLElement(node) {
    try {
      node.cloneNode(false);
    } catch (e) {
      return false;
    }

    return true;
  }

  var invalidContainerMessage = "Invalid value of the first argument of `gantt.init`. Supported values: HTMLElement, String (element id)." + "This error means that either invalid object is passed into `gantt.init` or that the element with the specified ID doesn't exist on the page when `gantt.init` is called.";

  function validateNode(node) {
    if (!node || typeof node == 'string' && document.getElementById(node)) return true;
    if (isHTMLElement(node)) return true;
    gantt.assert(false, invalidContainerMessage);
    throw new Error(invalidContainerMessage);
  } //initial initialization


  gantt.init = function (node, from, to) {
    if (gantt.env.isNode) {
      node = null; // for the nodejs version
    } else {
      validateNode(node); // for the web version
    }

    if (from && to) {
      this.config.start_date = this._min_date = new Date(from);
      this.config.end_date = this._max_date = new Date(to);
    }

    this.date.init(); //can be called only once

    this.init = function (node) {
      if (gantt.env.isNode) {
        node = null; // for the nodejs version
      } else {
        validateNode(node); // for the web version
      }

      if (this.$container && this.$container.parentNode) {
        this.$container.parentNode.removeChild(this.$container);
        this.$container = null;
      }

      if (this.$layout) {
        this.$layout.clear();
      }

      this._reinit(node);
    };

    this._reinit(node);
  };

  gantt._quickRefresh = function (code) {
    var stores = this._getDatastores.call(this);

    for (var i = 0; i < stores.length; i++) {
      stores[i]._quick_refresh = true;
    }

    code();

    for (var i = 0; i < stores.length; i++) {
      stores[i]._quick_refresh = false;
    }
  };

  var dropLayout = function dropLayout() {
    if (this._clearTaskLayers) {
      this._clearTaskLayers();
    }

    if (this._clearLinkLayers) {
      this._clearLinkLayers();
    }

    if (this.$layout) {
      this.$layout.destructor();
      this.$layout = null;
      this.$ui.reset();
    }
  }.bind(gantt);

  var rebuildLayout = function rebuildLayout() {
    if (isHeadless(gantt)) {
      return;
    }

    this.$root.innerHTML = "";
    this.$root.gantt = this;
    calculateScaleRange(this);
    this.config.layout.id = "main";
    this.$layout = this.$ui.createView("layout", this.$root, this.config.layout);
    this.$layout.attachEvent("onBeforeResize", function () {
      var storeNames = gantt.$services.getService("datastores");

      for (var i = 0; i < storeNames.length; i++) {
        gantt.getDatastore(storeNames[i]).filter();

        if (gantt.$data.tasksStore._skipTaskRecalculation) {
          // do not repaint items, they will be repainted later in the onStoreUpdate event
          if (gantt.$data.tasksStore._skipTaskRecalculation != "lightbox") {
            gantt.$data.tasksStore._skipTaskRecalculation = false;
          }
        } else {
          gantt.getDatastore(storeNames[i]).callEvent("onBeforeRefreshAll", []);
        }
      }
    });
    this.$layout.attachEvent("onResize", function () {
      gantt._quickRefresh(function () {
        gantt.refreshData();
      });
    });
    this.callEvent("onGanttLayoutReady", []);
    this.$layout.render();
    this.$container = this.$layout.$container.firstChild;
    addResizeListener(this);
  }.bind(gantt);

  gantt.resetLayout = function () {
    dropLayout();
    rebuildLayout();
    this.render();
  };

  gantt._reinit = function (node) {
    this.callEvent("onBeforeGanttReady", []);

    this._update_flags();

    var config = this.$services.getService("templateLoader");
    config.initTemplates(this);
    dropLayout();
    this.$root = null;

    if (node) {
      this.$root = domHelpers.toNode(node);
      rebuildLayout();
      this.$mouseEvents.reset(this.$root);
    }

    this.callEvent("onTemplatesReady", []);
    this.callEvent("onGanttReady", []);
    this.render();
  };

  gantt.$click = {
    buttons: {
      "edit": function edit(id) {
        if (gantt.isReadonly(gantt.getTask(id))) {
          return;
        }

        gantt.showLightbox(id);
      },
      "delete": function _delete(id) {
        var task = gantt.getTask(id);

        if (gantt.isReadonly(task)) {
          return;
        }

        var question = gantt.locale.labels.confirm_deleting;
        var title = gantt.locale.labels.confirm_deleting_title;

        gantt._simple_confirm(question, title, function () {
          if (!gantt.isTaskExists(id)) {
            gantt.hideLightbox();
            return;
          }

          if (task.$new) {
            // GS-2170. Do not recalculate the indexes and dates of other tasks
            // as they will be recalculated in the `refreshData`
            gantt.$data.tasksStore._skipTaskRecalculation = "lightbox";
            gantt.silent(function () {
              gantt.deleteTask(id, true);
            });
            gantt.$data.tasksStore._skipTaskRecalculation = false;
            gantt.refreshData();
          } else {
            gantt.$data.tasksStore._skipTaskRecalculation = true;
            gantt.deleteTask(id);
          }

          gantt.hideLightbox();
        });
      }
    }
  }; //renders self

  gantt.render = function () {
    this.callEvent("onBeforeGanttRender", []);
    var visibleDate;

    if (!isHeadless(gantt)) {
      if (!this.config.sort && this._sort) {
        this._sort = undefined;
      }

      if (this.$root) {
        if (this.config.rtl) {
          this.$root.classList.add("gantt_rtl");
          this.$root.firstChild.classList.add("gantt_rtl"); // GS-1499
        } else {
          this.$root.classList.remove("gantt_rtl");
          this.$root.firstChild.classList.remove("gantt_rtl"); // GS-1499
        }
      }

      var pos = this.getScrollState();
      var posX = pos ? pos.x : 0;

      if (this._getHorizontalScrollbar()) {
        var scrollbar = this._getHorizontalScrollbar();

        posX = scrollbar.$config.codeScrollLeft || posX || 0;
      }

      visibleDate = null;

      if (posX) {
        visibleDate = gantt.dateFromPos(posX + this.config.task_scroll_offset);
      }
    }

    calculateScaleRange(this);

    if (!isHeadless(gantt)) {
      this.$layout.$config.autosize = this.config.autosize;
      var preserveScroll = this.config.preserve_scroll;
      this.config.preserve_scroll = false; // prevent scrolling from layout resize, scroll will be called here later on

      this.$layout.resize();
      this.config.preserve_scroll = preserveScroll;

      if (this.config.preserve_scroll && pos) {
        // GS-1640: We need pos.y, otherwise part of the timeline won't be rendered if the scrollbar disappeared
        if (posX || pos.y) {
          var new_pos = gantt.getScrollState();
          var new_date = gantt.dateFromPos(new_pos.x);

          if (!(+visibleDate == +new_date && new_pos.y == pos.y)) {
            var posX = null;
            var posY = null;

            if (visibleDate) {
              var posX = Math.max(gantt.posFromDate(visibleDate) - gantt.config.task_scroll_offset, 0);
            }

            if (pos.y) {
              posY = pos.y;
            }

            gantt.scrollTo(posX, posY);
          }
        } // GS-1640: We need to reset the scroll position for the grid if the scrollbar disappeared and
        // the grid and timeline have different scrollbars


        var gridCell = gantt.$ui.getView("grid");

        if (gridCell) {
          var attachedScrollbar = gridCell.$config.scrollY;
          var verticalScrollbar = gantt.$ui.getView(attachedScrollbar);

          if (verticalScrollbar) {
            var scrollbarNodeVisible = gantt.utils.dom.isChildOf(verticalScrollbar.$view, gantt.$container);

            if (!scrollbarNodeVisible) {
              gridCell.scrollTo(undefined, 0);
            }
          }
        }
      }
    } else {
      gantt.refreshData();
    }

    this.callEvent("onGanttRender", []);
  }; //TODO: add layout.resize method that wouldn't trigger data repaint


  gantt.setSizes = gantt.render;

  gantt.getTaskRowNode = function (id) {
    var els = this.$grid_data.childNodes;
    var attribute = this.config.task_attribute;

    for (var i = 0; i < els.length; i++) {
      if (els[i].getAttribute) {
        var value = els[i].getAttribute(attribute);
        if (value == id) return els[i];
      }
    }

    return null;
  };

  gantt.changeLightboxType = function (type) {
    if (this.getLightboxType() == type) return true;

    gantt._silent_redraw_lightbox(type);
  };

  gantt._get_link_type = function (from_start, to_start) {
    var type = null;

    if (from_start && to_start) {
      type = gantt.config.links.start_to_start;
    } else if (!from_start && to_start) {
      type = gantt.config.links.finish_to_start;
    } else if (!from_start && !to_start) {
      type = gantt.config.links.finish_to_finish;
    } else if (from_start && !to_start) {
      type = gantt.config.links.start_to_finish;
    }

    return type;
  };

  gantt.isLinkAllowed = function (from, to, from_start, to_start) {
    var link = null;

    if (_typeof(from) == "object") {
      link = from;
    } else {
      link = {
        source: from,
        target: to,
        type: this._get_link_type(from_start, to_start)
      };
    }

    if (!link) return false;
    if (!(link.source && link.target && link.type)) return false;
    if (link.source == link.target) return false;
    var res = true; //any custom rules

    if (this.checkEvent("onLinkValidation")) res = this.callEvent("onLinkValidation", [link]);
    return res;
  };

  gantt._correct_dst_change = function (date, prevOffset, step, unit) {
    var time_unit = helpers.getSecondsInUnit(unit) * step;

    if (time_unit > 60 * 60 && time_unit < 60 * 60 * 24) {
      //correct dst change only if current unit is more than one hour and less than day (days have own checking), e.g. 12h
      var offsetChanged = date.getTimezoneOffset() - prevOffset;

      if (offsetChanged) {
        date = gantt.date.add(date, offsetChanged, "minute");
      }
    }

    return date;
  };

  gantt.isSplitTask = function (task) {
    gantt.assert(task && task instanceof Object, "Invalid argument <b>task</b>=" + task + " of gantt.isSplitTask. Task object was expected");
    return this.$data.tasksStore._isSplitItem(task);
  };

  gantt._is_icon_open_click = function (e) {
    if (!e) return false;
    var target = e.target || e.srcElement;
    if (!(target && target.className)) return false;
    var className = domHelpers.getClassName(target);
    if (className.indexOf("gantt_tree_icon") !== -1 && (className.indexOf("gantt_close") !== -1 || className.indexOf("gantt_open") !== -1)) return true;
    return false;
  };
};