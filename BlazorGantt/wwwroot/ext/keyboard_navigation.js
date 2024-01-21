module.exports = function (gantt) {
  var eventable = require("../utils/eventable");

  function setupKeyNav(gantt) {
    gantt.config.keyboard_navigation = true;
    gantt.config.keyboard_navigation_cells = false;
    gantt.$keyboardNavigation = {};

    gantt._compose = function () {
      var parts = Array.prototype.slice.call(arguments, 0);
      var res = {};

      for (var i = 0; i < parts.length; i++) {
        var obj = parts[i];

        if (typeof obj == "function") {
          obj = new obj();
        }

        for (var p in obj) {
          res[p] = obj[p];
        }
      }

      return res;
    };

    require("./keyboard_navigation/common/keyboard_shortcuts")(gantt);

    require("./keyboard_navigation/common/eventhandler")(gantt);

    require("./keyboard_navigation/common/trap_modal_focus")(gantt);

    require("./keyboard_navigation/elements/gantt_node")(gantt);

    require("./keyboard_navigation/elements/nav_node")(gantt);

    require("./keyboard_navigation/elements/header_cell")(gantt);

    require("./keyboard_navigation/elements/task_row")(gantt);

    require("./keyboard_navigation/elements/task_cell")(gantt);

    require("./keyboard_navigation/modals")(gantt);

    require("./keyboard_navigation/core")(gantt);

    var domHelpers = require("../core/ui/utils/dom_helpers");

    (function () {
      var dispatcher = gantt.$keyboardNavigation.dispatcher;

      dispatcher.isTaskFocused = function (id) {
        var node = dispatcher.activeNode;

        if (node instanceof gantt.$keyboardNavigation.TaskRow || node instanceof gantt.$keyboardNavigation.TaskCell) {
          if (node.taskId == id) {
            return true;
          }
        }

        return false;
      };

      var keyDownHandler = function keyDownHandler(e) {
        if (!gantt.config.keyboard_navigation) return; // GS-734 & GS-1078: we don't need keyboard navigation inside inline editors

        if (!gantt.config.keyboard_navigation_cells && isInlineEditorCell(e)) return;

        if (isNoKeyboardNavigationElement(e) || isLightboxElement(e)) {
          return;
        }

        return dispatcher.keyDownHandler(e);
      };

      var focusHandler = function focusHandler(e) {
        if (dispatcher.$preventDefault) {
          e.preventDefault();
          gantt.$container.blur();
          return false; // do nothing if key-nav focus is already planned
        } else if (!dispatcher.awaitsFocus()) {
          // otherwise - re-focus key-nav element on gantt focus
          dispatcher.focusGlobalNode();
        }
      };

      var reFocusActiveNode = function reFocusActiveNode() {
        if (!dispatcher.isEnabled()) return;
        var outsideGantt = !domHelpers.isChildOf(document.activeElement, gantt.$container) && document.activeElement.localName != "body";
        var activeNode = dispatcher.getActiveNode();
        if (!activeNode || outsideGantt) return;
        var domElement = activeNode.getNode();
        var top, left;

        if (domElement && domElement.parentNode) {
          top = domElement.parentNode.scrollTop;
          left = domElement.parentNode.scrollLeft;
        }

        activeNode.focus(true);

        if (domElement && domElement.parentNode) {
          domElement.parentNode.scrollTop = top;
          domElement.parentNode.scrollLeft = left;
        }
      };

      gantt.attachEvent("onDataRender", function () {
        if (!gantt.config.keyboard_navigation) return;
        reFocusActiveNode();
      });
      gantt.attachEvent("onGanttRender", function () {
        gantt.eventRemove(gantt.$root, "keydown", keyDownHandler);
        gantt.eventRemove(gantt.$container, "focus", focusHandler);
        gantt.eventRemove(gantt.$container, "mousedown", mousedownHandler);

        if (gantt.config.keyboard_navigation) {
          gantt.event(gantt.$root, "keydown", keyDownHandler);
          gantt.event(gantt.$container, "focus", focusHandler);
          gantt.event(gantt.$container, "mousedown", mousedownHandler);
          gantt.$container.setAttribute("tabindex", "0");
        } else {
          gantt.$container.removeAttribute("tabindex");
        }
      });

      function getTaskNodeConstructor() {
        if (gantt.config.keyboard_navigation_cells) {
          return gantt.$keyboardNavigation.TaskCell;
        } else {
          return gantt.$keyboardNavigation.TaskRow;
        }
      }

      function isInlineEditorCell(e) {
        return !!domHelpers.closest(e.target, ".gantt_grid_editor_placeholder");
      } // GS-1445. Cancel keyboard navigation within custom elements


      function isNoKeyboardNavigationElement(e) {
        return !!domHelpers.closest(e.target, ".no_keyboard_navigation");
      }

      function isLightboxElement(e) {
        return !!domHelpers.closest(e.target, ".gantt_cal_light");
      }

      function mousedownHandler(e) {
        if (!gantt.config.keyboard_navigation) return true; // GS-734 & GS-1078: we don't need keyboard navigation inside inline editors

        if (!gantt.config.keyboard_navigation_cells && isInlineEditorCell(e)) return true;

        if (isNoKeyboardNavigationElement(e)) {
          return;
        }

        var focusNode;
        var locateTask = dispatcher.fromDomElement(e);

        if (locateTask) {
          //var node = getTaskNodeConstructor();
          if (dispatcher.activeNode instanceof gantt.$keyboardNavigation.TaskCell && domHelpers.isChildOf(e.target, gantt.$task)) {
            locateTask = new gantt.$keyboardNavigation.TaskCell(locateTask.taskId, dispatcher.activeNode.columnIndex);
          }

          focusNode = locateTask;
        }

        if (focusNode) {
          if (!dispatcher.isEnabled()) {
            dispatcher.activeNode = focusNode;
          } else {
            dispatcher.delay(function () {
              dispatcher.setActiveNode(focusNode);
            });
          }
        } else {
          // empty click should drop focus from gantt, insert of reselecting default node
          dispatcher.$preventDefault = true;
          setTimeout(function () {
            dispatcher.$preventDefault = false;
          }, 300);
        }
      }

      var onReady = gantt.attachEvent("onGanttReady", function () {
        // restore focus on repainted tasks
        gantt.detachEvent(onReady);
        gantt.$data.tasksStore.attachEvent("onStoreUpdated", function (id) {
          if (gantt.config.keyboard_navigation && dispatcher.isEnabled()) {
            var currentNode = dispatcher.getActiveNode();

            if (currentNode && currentNode.taskId == id) {
              reFocusActiveNode();
            }
          }
        });

        if (gantt._smart_render) {
          var updateRender = gantt._smart_render._redrawTasks;

          gantt._smart_render._redrawTasks = function (renderers, items) {
            if (gantt.config.keyboard_navigation && dispatcher.isEnabled()) {
              var currentNode = dispatcher.getActiveNode();

              if (currentNode && currentNode.taskId !== undefined) {
                var focusedItemVisible = false;

                for (var i = 0; i < items.length; i++) {
                  if (items[i].id == currentNode.taskId && items[i].start_date) {
                    focusedItemVisible = true;
                    break;
                  }
                }

                if (!focusedItemVisible) {
                  items.push(gantt.getTask(currentNode.taskId));
                }
              }
            }

            var res = updateRender.apply(this, arguments);
            return res;
          };
        }
      });
      var createdTaskId = null;
      var keepFocusOnNewTask = false;
      gantt.attachEvent("onTaskCreated", function (task) {
        createdTaskId = task.id;
        return true;
      });
      gantt.attachEvent("onAfterTaskAdd", function (id, item) {
        if (!gantt.config.keyboard_navigation) return true;

        if (dispatcher.isEnabled()) {
          // GS-1394. After adding a new task, the focus shouldn't change to the placeholder task
          if (id == createdTaskId) {
            keepFocusOnNewTask = true;
            setTimeout(function () {
              keepFocusOnNewTask = false;
              createdTaskId = null;
            });
          }

          if (keepFocusOnNewTask && item.type == gantt.config.types.placeholder) {
            return;
          }

          var columnIndex = 0;
          var node = dispatcher.activeNode;

          if (node instanceof gantt.$keyboardNavigation.TaskCell) {
            columnIndex = node.columnIndex;
          }

          var nodeConstructor = getTaskNodeConstructor();

          if (item.type == gantt.config.types.placeholder && gantt.config.placeholder_task.focusOnCreate === false) {// do not focus on the placeholder task
          } else {
            dispatcher.setActiveNode(new nodeConstructor(id, columnIndex));
          }
        }
      });
      gantt.attachEvent("onTaskIdChange", function (oldId, newId) {
        if (!gantt.config.keyboard_navigation) return true;
        var node = dispatcher.activeNode;

        if (dispatcher.isTaskFocused(oldId)) {
          node.taskId = newId;
        }

        return true;
      });
      var interval = setInterval(function () {
        if (!gantt.config.keyboard_navigation) return;

        if (!dispatcher.isEnabled()) {
          dispatcher.enable();
        }

        return;
      }, 500);
      gantt.attachEvent("onDestroy", function () {
        clearInterval(interval);
      });

      function getScopeName(obj) {
        if (obj instanceof gantt.$keyboardNavigation.GanttNode) {
          return "gantt";
        } else if (obj instanceof gantt.$keyboardNavigation.HeaderCell) {
          return "headerCell";
        } else if (obj instanceof gantt.$keyboardNavigation.TaskRow) {
          return "taskRow";
        } else if (obj instanceof gantt.$keyboardNavigation.TaskCell) {
          return "taskCell";
        }

        return null;
      }

      function getScope(mode) {
        var scopes = {
          "gantt": gantt.$keyboardNavigation.GanttNode,
          "headerCell": gantt.$keyboardNavigation.HeaderCell,
          "taskRow": gantt.$keyboardNavigation.TaskRow,
          "taskCell": gantt.$keyboardNavigation.TaskCell
        };
        return scopes[mode] || scopes.gantt;
      }

      function findVisibleColumnIndex(columnName) {
        var columns = gantt.getGridColumns();

        for (var i = 0; i < columns.length; i++) {
          if (columns[i].name == columnName) {
            return i;
          }
        }

        return 0;
      }

      var keyNavFacade = {};
      eventable(keyNavFacade);
      gantt.mixin(keyNavFacade, {
        addShortcut: function addShortcut(shortcut, handler, scope) {
          var scopeObject = getScope(scope);

          if (scopeObject) {
            scopeObject.prototype.bind(shortcut, handler);
          }
        },
        getShortcutHandler: function getShortcutHandler(shortcut, scope) {
          var commands = gantt.$keyboardNavigation.shortcuts.parse(shortcut);

          if (commands.length) {
            return keyNavFacade.getCommandHandler(commands[0], scope);
          }
        },
        getCommandHandler: function getCommandHandler(command, scope) {
          var scopeObject = getScope(scope);

          if (scopeObject) {
            if (command) {
              return scopeObject.prototype.findHandler(command);
            }
          }
        },
        removeShortcut: function removeShortcut(shortcut, scope) {
          var scopeObject = getScope(scope);

          if (scopeObject) {
            scopeObject.prototype.unbind(shortcut);
          }
        },
        focus: function focus(config) {
          var type = config ? config.type : null;
          var constructor = getScope(type);
          var node;

          switch (type) {
            case "taskCell":
              node = new constructor(config.id, findVisibleColumnIndex(config.column));
              break;

            case "taskRow":
              node = new constructor(config.id);
              break;

            case "headerCell":
              node = new constructor(findVisibleColumnIndex(config.column));
              break;

            default:
              break;
          }

          dispatcher.delay(function () {
            if (node) {
              dispatcher.setActiveNode(node);
            } else {
              dispatcher.enable();

              if (!dispatcher.getActiveNode()) {
                dispatcher.setDefaultNode();
              } else {
                if (!dispatcher.awaitsFocus()) {
                  dispatcher.enable();
                }
              }
            }
          });
        },
        getActiveNode: function getActiveNode() {
          if (dispatcher.isEnabled()) {
            var node = dispatcher.getActiveNode();
            var scope = getScopeName(node);
            var columns = gantt.getGridColumns();

            switch (scope) {
              case "taskCell":
                return {
                  type: "taskCell",
                  id: node.taskId,
                  column: columns[node.columnIndex].name
                };

              case "taskRow":
                return {
                  type: "taskRow",
                  id: node.taskId
                };

              case "headerCell":
                return {
                  type: "headerCell",
                  column: columns[node.index].name
                };
            }
          }

          return null;
        }
      });
      gantt.$keyboardNavigation.facade = keyNavFacade;
      gantt.ext.keyboardNavigation = keyNavFacade;

      gantt.focus = function () {
        keyNavFacade.focus();
      };

      gantt.addShortcut = keyNavFacade.addShortcut;
      gantt.getShortcutHandler = keyNavFacade.getShortcutHandler;
      gantt.removeShortcut = keyNavFacade.removeShortcut;
    })();
  }

  setupKeyNav(gantt);
};