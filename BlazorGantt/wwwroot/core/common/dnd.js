var eventable = require("../../utils/eventable");

var utils = require("../../utils/utils");

var timeout = require("../../utils/timeout");

var global = require("../../utils/global");

var domHelpers = require("../ui/utils/dom_helpers");

module.exports = function (gantt) {
  function copyDomEvent(e) {
    return {
      target: e.target || e.srcElement,
      pageX: e.pageX,
      pageY: e.pageY,
      clientX: e.clientX,
      clientY: e.clientY,
      metaKey: e.metaKey,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey
    };
  }

  function DnD(obj, config) {
    this._obj = obj;
    this._settings = config || {};
    eventable(this);
    var inputMethods = this.getInputMethods();
    this._drag_start_timer = null;
    gantt.attachEvent("onGanttScroll", utils.bind(function (left, top) {
      this.clearDragTimer();
    }, this));
    var lastDown = 0;
    var eventParams = {
      passive: false
    };

    for (var i = 0; i < inputMethods.length; i++) {
      utils.bind(function (input) {
        gantt.event(obj, input.down, utils.bind(function (e) {
          if (!input.accessor(e)) {
            return;
          }

          if (config.preventDefault && config.selector && domHelpers.closest(e.target, config.selector)) {
            e.preventDefault();
          }

          if (gantt.config.touch && e.timeStamp && e.timeStamp - lastDown < 300) {
            return;
          }

          this._settings.original_target = copyDomEvent(e);

          if (gantt.config.touch) {
            this.clearDragTimer();
            this._drag_start_timer = setTimeout(utils.bind(function () {
              if (gantt.getState().lightbox) {
                return;
              }

              this.dragStart(obj, e, input);
            }, this), gantt.config.touch_drag);
          } else {
            this.dragStart(obj, e, input);
          }
        }, this), eventParams);
        var eventElement = document.body;
        gantt.event(eventElement, input.up, utils.bind(function (e) {
          if (!input.accessor(e)) {
            return;
          }

          this.clearDragTimer();
        }, this), eventParams);
      }, this)(inputMethods[i]);
    }
  }

  DnD.prototype = {
    traceDragEvents: function traceDragEvents(domElement, inputMethod) {
      var mousemove = utils.bind(function (e) {
        return this.dragMove(domElement, e, inputMethod.accessor);
      }, this);
      utils.bind(function (e) {
        return this.dragScroll(domElement, e);
      }, this);
      var limited_mousemove = utils.bind(function (e) {
        if (this.config.started && utils.defined(this.config.updates_per_second)) {
          if (!timeout(this, this.config.updates_per_second)) return;
        }

        var dndActive = mousemove(e);

        if (dndActive) {
          try {
            if (e && e.preventDefault && e.cancelable) {
              //e.cancelable condition - because navigator.vibrate is blocked by Chrome
              e.preventDefault(); //Cancel default action on DND
            } //Cancel default action on DND

          } catch (e) {// just suppress the exception, nothing needed to be done here
          } //e.cancelBubble = true;

        }

        return dndActive;
      }, this);
      var eventElement = domHelpers.getRootNode(gantt.$root);
      var mousemoveContainer = this.config.mousemoveContainer || domHelpers.getRootNode(gantt.$root);
      var eventParams = {
        passive: false
      };
      var mouseup = utils.bind(function (e) {
        gantt.eventRemove(mousemoveContainer, inputMethod.move, limited_mousemove);
        gantt.eventRemove(eventElement, inputMethod.up, mouseup, eventParams);
        return this.dragEnd(domElement);
      }, this);
      gantt.event(mousemoveContainer, inputMethod.move, limited_mousemove, eventParams);
      gantt.event(eventElement, inputMethod.up, mouseup, eventParams);
    },
    checkPositionChange: function checkPositionChange(pos) {
      var diff_x = pos.x - this.config.pos.x;
      var diff_y = pos.y - this.config.pos.y;
      var distance = Math.sqrt(Math.pow(Math.abs(diff_x), 2) + Math.pow(Math.abs(diff_y), 2));

      if (distance > this.config.sensitivity) {
        return true;
      } else {
        return false;
      }
    },
    initDnDMarker: function initDnDMarker() {
      // create dnd placeholder and put it in dom
      var marker = this.config.marker = document.createElement("div");
      marker.className = "gantt_drag_marker"; // GS-1333: don't show any message when we resize grid columns

      marker.innerHTML = "";
      document.body.appendChild(marker);
    },
    backupEventTarget: function backupEventTarget(domEvent, getEvent) {
      if (!gantt.config.touch) {
        return;
      } // keep original event target in DOM in order to keep dnd on touchmove event


      var e = getEvent(domEvent);
      var el = e.target || e.srcElement;
      var copy = el.cloneNode(true); //this.config.target.target = copy;

      this.config.original_target = copyDomEvent(e);
      this.config.original_target.target = copy;
      this.config.backup_element = el;
      el.parentNode.appendChild(copy);
      el.style.display = "none";
      var mousemoveContainer = this.config.mousemoveContainer || document.body;
      mousemoveContainer.appendChild(el);
    },
    getInputMethods: function getInputMethods() {
      // bind actions to browser events
      var inputMethods = [];
      inputMethods.push({
        "move": "mousemove",
        "down": "mousedown",
        "up": "mouseup",
        "accessor": function accessor(e) {
          return e;
        }
      });

      if (gantt.config.touch) {
        var touchEventsSupported = true;

        try {
          document.createEvent("TouchEvent");
        } catch (e) {
          touchEventsSupported = false;
        }

        if (touchEventsSupported) {
          inputMethods.push({
            "move": "touchmove",
            "down": "touchstart",
            "up": "touchend",
            "accessor": function accessor(ev) {
              if (ev.touches && ev.touches.length > 1) return null;
              if (ev.touches[0]) return {
                target: document.elementFromPoint(ev.touches[0].clientX, ev.touches[0].clientY),
                pageX: ev.touches[0].pageX,
                pageY: ev.touches[0].pageY,
                clientX: ev.touches[0].clientX,
                clientY: ev.touches[0].clientY
              };else return ev;
            }
          });
        } else if (global.navigator.pointerEnabled) {
          inputMethods.push({
            "move": "pointermove",
            "down": "pointerdown",
            "up": "pointerup",
            "accessor": function accessor(ev) {
              if (ev.pointerType == "mouse") return null;
              return ev;
            }
          });
        } else if (global.navigator.msPointerEnabled) {
          inputMethods.push({
            "move": "MSPointerMove",
            "down": "MSPointerDown",
            "up": "MSPointerUp",
            "accessor": function accessor(ev) {
              if (ev.pointerType == ev.MSPOINTER_TYPE_MOUSE) return null;
              return ev;
            }
          });
        }
      }

      return inputMethods;
    },
    clearDragTimer: function clearDragTimer() {
      if (this._drag_start_timer) {
        clearTimeout(this._drag_start_timer);
        this._drag_start_timer = null;
      }
    },
    dragStart: function dragStart(obj, e, inputMethod) {
      if (this.config && this.config.started) {
        return;
      }

      this.config = {
        obj: obj,
        marker: null,
        started: false,
        pos: this.getPosition(e),
        sensitivity: 4
      };
      if (this._settings) utils.mixin(this.config, this._settings, true);
      this.traceDragEvents(obj, inputMethod);
      gantt._prevent_touch_scroll = true;
      document.body.className += " gantt_noselect";

      if (gantt.config.touch) {
        this.dragMove(obj, e, inputMethod.accessor);
      }
    },
    dragMove: function dragMove(obj, e, getEvent) {
      var source = getEvent(e);
      if (!source) return false;

      if (!this.config.marker && !this.config.started) {
        var pos = this.getPosition(source);

        if (gantt.config.touch || this.checkPositionChange(pos)) {
          // real drag starts here,
          // when user moves mouse at first time after onmousedown
          this.config.started = true;
          this.config.ignore = false;

          if (this.callEvent("onBeforeDragStart", [obj, this.config.original_target]) === false) {
            this.config.ignore = true;
            return false;
          }

          this.backupEventTarget(e, getEvent);
          this.initDnDMarker();

          gantt._touch_feedback();

          this.callEvent("onAfterDragStart", [obj, this.config.original_target]);
        } else {
          this.config.ignore = true;
        }
      }

      if (!this.config.ignore) {
        // GS-1279 Gantt crashes on Mobile Firefox after starting to create a link and moving finger outisde the page.
        if (e.targetTouches && !source.target) return;
        source.pos = this.getPosition(source);
        this.config.marker.style.left = source.pos.x + "px";
        this.config.marker.style.top = source.pos.y + "px";
        this.callEvent("onDragMove", [obj, source]);
        return true;
      }

      return false;
    },
    dragEnd: function dragEnd(obj) {
      var target = this.config.backup_element;

      if (target && target.parentNode) {
        target.parentNode.removeChild(target);
      }

      gantt._prevent_touch_scroll = false;

      if (this.config.marker) {
        this.config.marker.parentNode.removeChild(this.config.marker);
        this.config.marker = null;
        this.callEvent("onDragEnd", []);
      }

      this.config.started = false;
      document.body.className = document.body.className.replace(" gantt_noselect", "");
    },
    getPosition: function getPosition(e) {
      var x = 0,
          y = 0;

      if (e.pageX || e.pageY) {
        x = e.pageX;
        y = e.pageY;
      } else if (e.clientX || e.clientY) {
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
      }

      return {
        x: x,
        y: y
      };
    }
  };
  return DnD;
};