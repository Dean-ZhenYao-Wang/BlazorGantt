var domHelpers = require("./utils/dom_helpers");

var createMouseHandler = function (domHelpers) {
  return function (gantt) {
    var eventHandlers = {
      "click": {},
      "doubleclick": {},
      "contextMenu": {}
    };

    function addEventTarget(event, className, handler, root) {
      if (!eventHandlers[event][className]) {
        eventHandlers[event][className] = [];
      }

      eventHandlers[event][className].push({
        handler: handler,
        root: root
      });
    }

    function callHandler(eventName, className, root, args) {
      var handlers = eventHandlers[eventName][className];

      if (handlers) {
        for (var i = 0; i < handlers.length; i++) {
          if (!(root || handlers[i].root) || handlers[i].root === root) {
            handlers[i].handler.apply(this, args);
          }
        }
      }
    }

    function onClick(e) {
      e = e || window.event;
      var id = gantt.locate(e);
      var handlers = findEventHandlers(e, eventHandlers.click);
      var res = true;

      if (id !== null) {
        res = !gantt.checkEvent("onTaskClick") || gantt.callEvent("onTaskClick", [id, e]);
      } else {
        gantt.callEvent("onEmptyClick", [e]);
      }

      if (res) {
        var default_action = callEventHandlers(handlers, e, id);
        if (!default_action) return; // GS-1025: if we don't do that, the dropdown or date select will be closed for unselected tasks
        // GS-1078: or for the built-in select inline editor

        switch (e.target.nodeName) {
          case "SELECT":
          case 'INPUT':
            return;
        } //allow task selection when the multiselect plugin is not enabled


        if (id && gantt.getTask(id) && !gantt._multiselect && gantt.config.select_task) {
          gantt.selectTask(id);
        }
      }
    }

    function onContextMenu(e) {
      e = e || window.event;
      var src = e.target || e.srcElement,
          taskId = gantt.locate(src),
          linkId = gantt.locate(src, gantt.config.link_attribute);
      var res = !gantt.checkEvent("onContextMenu") || gantt.callEvent("onContextMenu", [taskId, linkId, e]);

      if (!res) {
        if (e.preventDefault) e.preventDefault();else e.returnValue = false;
      }

      return res;
    }

    function findEventHandlers(e, hash) {
      var trg = e.target || e.srcElement;
      var handlers = [];

      while (trg) {
        var css = domHelpers.getClassName(trg);

        if (css) {
          css = css.split(" ");

          for (var i = 0; i < css.length; i++) {
            if (!css[i]) continue;

            if (hash[css[i]]) {
              var delegateHandlers = hash[css[i]];

              for (var h = 0; h < delegateHandlers.length; h++) {
                if (delegateHandlers[h].root) {
                  if (!domHelpers.isChildOf(trg, delegateHandlers[h].root)) {
                    continue;
                  }
                }

                handlers.push(delegateHandlers[h].handler);
              }
            }
          }
        }

        trg = trg.parentNode;
      }

      return handlers;
    }

    function callEventHandlers(handlers, e, id) {
      var res = true;

      for (var i = 0; i < handlers.length; i++) {
        var handlerResult = handlers[i].call(gantt, e, id, e.target || e.srcElement);
        res = res && !(typeof handlerResult != "undefined" && handlerResult !== true);
      }

      return res;
    }

    function onDoubleClick(e) {
      e = e || window.event;
      var id = gantt.locate(e);
      var handlers = findEventHandlers(e, eventHandlers.doubleclick); // when doubleclick fired not on task, id === null

      var res = !gantt.checkEvent("onTaskDblClick") || id === null || gantt.callEvent("onTaskDblClick", [id, e]);

      if (res) {
        var default_action = callEventHandlers(handlers, e, id);
        if (!default_action) return;

        if (id !== null && gantt.getTask(id)) {
          if (res && gantt.config.details_on_dblclick && !gantt.isReadonly(id)) {
            gantt.showLightbox(id);
          }
        }
      }
    }

    function onMouseMove(e) {
      if (gantt.checkEvent("onMouseMove")) {
        var id = gantt.locate(e);
        gantt._last_move_event = e;
        gantt.callEvent("onMouseMove", [id, e]);
      }
    }

    function detach(eventName, className, handler, root) {
      if (eventHandlers[eventName] && eventHandlers[eventName][className]) {
        var handlers = eventHandlers[eventName];
        var elementHandlers = handlers[className];

        for (var i = 0; i < elementHandlers.length; i++) {
          if (elementHandlers[i].root == root) {
            elementHandlers.splice(i, 1);
            i--;
          }
        }

        if (!elementHandlers.length) {
          delete handlers[className];
        }
      }
    }

    var domEvents = gantt._createDomEventScope();

    function reset(node) {
      domEvents.detachAll();

      if (node) {
        domEvents.attach(node, "click", onClick);
        domEvents.attach(node, "dblclick", onDoubleClick);
        domEvents.attach(node, "mousemove", onMouseMove);
        domEvents.attach(node, "contextmenu", onContextMenu);
      }
    }

    return {
      reset: reset,
      global: function global(event, classname, handler) {
        addEventTarget(event, classname, handler, null);
      },
      delegate: addEventTarget,
      detach: detach,
      callHandler: callHandler,
      onDoubleClick: onDoubleClick,
      onMouseMove: onMouseMove,
      onContextMenu: onContextMenu,
      onClick: onClick,
      destructor: function destructor() {
        reset();
        eventHandlers = null;
        domEvents = null;
      }
    };
  };
}(domHelpers);

module.exports = {
  init: createMouseHandler
};