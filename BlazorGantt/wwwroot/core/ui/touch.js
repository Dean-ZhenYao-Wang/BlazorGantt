module.exports = function (gantt) {
  gantt.config.touch_drag = 500; //nearly immediate dnd

  gantt.config.touch = true;
  gantt.config.touch_feedback = true;
  gantt.config.touch_feedback_duration = 1;
  gantt._prevent_touch_scroll = false;

  gantt._touch_feedback = function () {
    if (gantt.config.touch_feedback) {
      if (navigator.vibrate) navigator.vibrate(gantt.config.touch_feedback_duration);
    }
  };

  gantt.attachEvent("onGanttReady", gantt.bind(function () {
    if (this.config.touch != "force") this.config.touch = this.config.touch && (navigator.userAgent.indexOf("Mobile") != -1 || navigator.userAgent.indexOf("iPad") != -1 || navigator.userAgent.indexOf("Android") != -1 || navigator.userAgent.indexOf("Touch") != -1) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

    if (this.config.touch) {
      var touchEventsSupported = true;

      try {
        document.createEvent("TouchEvent");
      } catch (e) {
        touchEventsSupported = false;
      }

      if (touchEventsSupported) {
        this._touch_events(["touchmove", "touchstart", "touchend"], function (ev) {
          if (ev.touches && ev.touches.length > 1) return null;
          if (ev.touches[0]) return {
            target: ev.target,
            pageX: ev.touches[0].pageX,
            pageY: ev.touches[0].pageY,
            clientX: ev.touches[0].clientX,
            clientY: ev.touches[0].clientY
          };else return ev;
        }, function () {
          return false;
        });
      } else if (window.navigator.pointerEnabled) {
        this._touch_events(["pointermove", "pointerdown", "pointerup"], function (ev) {
          if (ev.pointerType == "mouse") return null;
          return ev;
        }, function (ev) {
          return !ev || ev.pointerType == "mouse";
        });
      } else if (window.navigator.msPointerEnabled) {
        this._touch_events(["MSPointerMove", "MSPointerDown", "MSPointerUp"], function (ev) {
          if (ev.pointerType == ev.MSPOINTER_TYPE_MOUSE) return null;
          return ev;
        }, function (ev) {
          return !ev || ev.pointerType == ev.MSPOINTER_TYPE_MOUSE;
        });
      }
    }
  }, gantt));

  function findTargetView(event) {
    var allViews = gantt.$layout.getCellsByType("viewCell");

    for (var i = 0; i < allViews.length; i++) {
      var box = allViews[i].$view.getBoundingClientRect();

      if (event.clientX >= box.left && event.clientX <= box.right && event.clientY <= box.bottom && event.clientY >= box.top) {
        return allViews[i];
      }
    }
  }

  function getScrollState(view) {
    var scrollX = view.$config.scrollX ? gantt.$ui.getView(view.$config.scrollX) : null;
    var scrollY = view.$config.scrollY ? gantt.$ui.getView(view.$config.scrollY) : null;
    var scrollState = {
      x: null,
      y: null
    };

    if (scrollX) {
      var state = scrollX.getScrollState();

      if (state.visible) {
        scrollState.x = scrollX.$view.scrollLeft;
      }
    }

    if (scrollY) {
      var state = scrollY.getScrollState();

      if (state.visible) {
        scrollState.y = scrollY.$view.scrollTop;
      }
    }

    return scrollState;
  }

  function scrollView(view, left, top) {
    var scrollX = view.$config.scrollX ? gantt.$ui.getView(view.$config.scrollX) : null;
    var scrollY = view.$config.scrollY ? gantt.$ui.getView(view.$config.scrollY) : null;

    if (scrollX) {
      scrollX.scrollTo(left, null);
    }

    if (scrollY) {
      scrollY.scrollTo(null, top);
    }
  }

  function getTaskDND() {
    var tasksDnD;

    if (gantt.$ui.getView("timeline")) {
      tasksDnD = gantt.$ui.getView("timeline")._tasks_dnd;
    }

    return tasksDnD;
  }

  var touchHandlers = []; //we can't use native scrolling, as we need to sync momentum between different parts
  //so we will block native scroll and use the custom one
  //in future we can add custom momentum

  gantt._touch_events = function (names, accessor, ignore) {
    //webkit on android need to be handled separately
    var dblclicktime = 0;
    var actionMode = false;
    var scrollMode = false;
    var actionStart = null;
    var scrollState;
    var longTapTimer = null;
    var currentDndId = null;
    var dndNodes = [];
    var targetView = null;

    for (var i = 0; i < touchHandlers.length; i++) {
      gantt.eventRemove(touchHandlers[i][0], touchHandlers[i][1], touchHandlers[i][2]);
    }

    touchHandlers = []; //touch move

    touchHandlers.push([gantt.$container, names[0], function (e) {
      var tasksDnD = getTaskDND();
      if (ignore(e)) return; //ignore common and scrolling moves

      if (!actionMode) return;
      if (longTapTimer) clearTimeout(longTapTimer);
      var source = accessor(e);

      if (tasksDnD && (tasksDnD.drag.id || tasksDnD.drag.start_drag)) {
        tasksDnD.on_mouse_move(source);
        if (e.preventDefault) e.preventDefault();
        e.cancelBubble = true;
        return false;
      }

      if (!gantt._prevent_touch_scroll) {
        if (source && actionStart) {
          var dx = actionStart.pageX - source.pageX;
          var dy = actionStart.pageY - source.pageY;

          if (!scrollMode && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            scrollMode = true; //gantt._touch_scroll_active = scroll_mode = true;

            dblclicktime = 0;

            if (targetView) {
              scrollState = getScrollState(targetView);
            } else {
              scrollState = gantt.getScrollState();
            }
          }

          if (scrollMode) {
            var newScrollState;
            var scrollX = scrollState.x + dx;
            var scrollY = scrollState.y + dy;

            if (targetView) {
              scrollView(targetView, scrollX, scrollY);
              newScrollState = getScrollState(targetView);
            } else {
              gantt.scrollTo(scrollX, scrollY);
              newScrollState = gantt.getScrollState();
            }

            if (scrollState.x != newScrollState.x && dy > 2 * dx || scrollState.y != newScrollState.y && dx > 2 * dy) {
              return block_action(e);
            }
          }
        }

        return block_action(e);
      }

      return true;
    }]); //block touch context menu in IE10

    touchHandlers.push([this.$container, "contextmenu", function (e) {
      if (actionMode) return block_action(e);
    }]); //touch start

    touchHandlers.push([this.$container, names[1], function (e) {
      // block pull-to-refresh
      if (document && document.body) {
        document.body.classList.add("gantt_touch_active");
      }

      if (ignore(e)) return;

      if (e.touches && e.touches.length > 1) {
        actionMode = false;
        return;
      }

      actionStart = accessor(e);
      targetView = findTargetView(actionStart);

      if (!gantt._locate_css(actionStart, "gantt_hor_scroll") && !gantt._locate_css(actionStart, "gantt_ver_scroll")) {
        actionMode = true;
      }

      var tasksDnD = getTaskDND(); //long tap

      longTapTimer = setTimeout(function () {
        var taskId = gantt.locate(actionStart);

        if (tasksDnD && taskId && !gantt._locate_css(actionStart, "gantt_link_control") && !gantt._locate_css(actionStart, "gantt_grid_data")) {
          tasksDnD.on_mouse_down(actionStart);

          if (tasksDnD.drag && tasksDnD.drag.start_drag) {
            cloneTaskRendered(taskId);

            tasksDnD._start_dnd(actionStart);

            gantt._touch_drag = true;
            gantt.refreshTask(taskId);

            gantt._touch_feedback();
          }
        }

        longTapTimer = null;
      }, gantt.config.touch_drag);
    }]); //touch end

    touchHandlers.push([this.$container, names[2], function (e) {
      if (document && document.body) {
        document.body.classList.remove("gantt_touch_active");
      }

      if (ignore(e)) return;
      if (longTapTimer) clearTimeout(longTapTimer);
      gantt._touch_drag = false;
      actionMode = false;
      var source = accessor(e);
      var tasksDnD = getTaskDND();
      if (tasksDnD) tasksDnD.on_mouse_up(source);

      if (currentDndId && gantt.isTaskExists(currentDndId)) {
        gantt.refreshTask(currentDndId);

        if (dndNodes.length) {
          dndNodes.forEach(function (node) {
            if (node.parentNode) {
              node.parentNode.removeChild(node);
            }
          });

          gantt._touch_feedback();
        }
      } //gantt._touch_scroll_active = action_mode = scroll_mode = false;


      actionMode = scrollMode = false;
      dndNodes = [];
      currentDndId = null; //dbl-tap handling

      if (actionStart && dblclicktime) {
        var now = new Date();

        if (now - dblclicktime < 500) {
          var mouseEvents = gantt.$services.getService("mouseEvents");
          mouseEvents.onDoubleClick(actionStart);
          block_action(e);
        } else dblclicktime = now;
      } else {
        dblclicktime = new Date();
      }
    }]);

    for (var i = 0; i < touchHandlers.length; i++) {
      gantt.event(touchHandlers[i][0], touchHandlers[i][1], touchHandlers[i][2]);
    } //common helper, prevents event


    function block_action(e) {
      if (e && e.preventDefault) {
        e.preventDefault();
      }

      e.cancelBubble = true;
      return false;
    }

    function cloneTaskRendered(taskId) {
      var renders = gantt._getTaskLayers();

      var task = gantt.getTask(taskId);

      if (task && gantt.isTaskVisible(taskId)) {
        currentDndId = taskId;

        for (var i = 0; i < renders.length; i++) {
          task = renders[i].rendered[taskId];

          if (task && task.getAttribute(gantt.config.task_attribute) && task.getAttribute(gantt.config.task_attribute) == taskId) {
            var copy = task.cloneNode(true);
            dndNodes.push(task);
            renders[i].rendered[taskId] = copy;
            task.style.display = "none";
            copy.className += " gantt_drag_move ";
            task.parentNode.appendChild(copy); //return copy;
          }
        }
      }
    }
  };
};