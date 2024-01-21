module.exports = function (gantt) {
  gantt.$keyboardNavigation.TaskRow = function (taskId) {
    if (!taskId) {
      var rootLevel = gantt.getChildren(gantt.config.root_id);

      if (rootLevel[0]) {
        taskId = rootLevel[0];
      }
    }

    this.taskId = taskId;

    if (gantt.isTaskExists(this.taskId)) {
      this.index = gantt.getTaskIndex(this.taskId);
      this.globalIndex = gantt.getGlobalTaskIndex(this.taskId);
    }
  };

  gantt.$keyboardNavigation.TaskRow.prototype = gantt._compose(gantt.$keyboardNavigation.KeyNavNode, {
    _handlers: null,
    isValid: function isValid() {
      return gantt.isTaskExists(this.taskId) && gantt.getTaskIndex(this.taskId) > -1;
    },
    fallback: function fallback() {
      if (!gantt.getVisibleTaskCount()) {
        var header = new gantt.$keyboardNavigation.HeaderCell();
        if (!header.isValid()) return null;else return header;
      } else {
        var nextIndex = -1; // GS-1393. When Gantt tries to restore the focus, it should rely on the global index

        if (gantt.getTaskByIndex(this.globalIndex - 1)) {
          nextIndex = this.globalIndex - 1;
        } else if (gantt.getTaskByIndex(this.globalIndex + 1)) {
          nextIndex = this.globalIndex + 1;
        } else {
          var globalIndex = this.globalIndex;

          while (globalIndex >= 0) {
            if (gantt.getTaskByIndex(globalIndex)) {
              nextIndex = globalIndex;
              break;
            }

            globalIndex--;
          }
        }

        if (nextIndex > -1) {
          return new gantt.$keyboardNavigation.TaskRow(gantt.getTaskByIndex(nextIndex).id);
        }
      }
    },
    fromDomElement: function fromDomElement(el) {
      if (gantt.config.keyboard_navigation_cells) {
        return null;
      }

      var taskId = gantt.locate(el);

      if (gantt.isTaskExists(taskId)) {
        return new gantt.$keyboardNavigation.TaskRow(taskId);
      } else {
        return null;
      }
    },
    getNode: function getNode() {
      if (gantt.isTaskExists(this.taskId) && gantt.isTaskVisible(this.taskId)) {
        if (gantt.config.show_grid) {
          return gantt.$grid.querySelector(".gantt_row[" + gantt.config.task_attribute + "='" + this.taskId + "']");
        } else {
          return gantt.getTaskNode(this.taskId);
        }
      }
    },
    focus: function focus(keptFocus) {
      if (!keptFocus) {
        var pos = gantt.getTaskPosition(gantt.getTask(this.taskId));
        var height = gantt.getTaskHeight(this.taskId);
        var scroll = gantt.getScrollState();
        var viewWidth;

        if (gantt.$task) {
          viewWidth = gantt.$task.offsetWidth;
        } else {
          viewWidth = scroll.inner_width;
        }

        var viewHeight;

        if (gantt.$grid_data || gantt.$task_data) {
          viewHeight = (gantt.$grid_data || gantt.$task_data).offsetHeight;
        } else {
          viewHeight = scroll.inner_height;
        }

        if (pos.top < scroll.y || pos.top + height > scroll.y + viewHeight) {
          gantt.scrollTo(null, pos.top - height * 5);
        } else if (gantt.config.scroll_on_click && gantt.config.show_chart) {
          // horizontal scroll activated
          if (pos.left > scroll.x + viewWidth) {
            // scroll forward to the start of the task
            gantt.scrollTo(pos.left - gantt.config.task_scroll_offset);
          } else if (pos.left + pos.width < scroll.x) {
            // scroll back to the end of the task
            gantt.scrollTo(pos.left + pos.width - gantt.config.task_scroll_offset);
          }
        }
      }

      gantt.$keyboardNavigation.KeyNavNode.prototype.focus.apply(this, [keptFocus]); // GS-152 if there are scrollbars with custom names, change their scroll position

      scrollGrid();

      function scrollGrid() {
        var grid = gantt.$ui.getView("grid");
        var scrollPositionX = parseInt(grid.$grid.scrollLeft);
        var scrollPositionY = parseInt(grid.$grid_data.scrollTop);
        var attachedScrollbarHorizontal = grid.$config.scrollX;

        if (attachedScrollbarHorizontal && grid.$config.scrollable) {
          var scrollbarHorizontal = gantt.$ui.getView(attachedScrollbarHorizontal);

          if (scrollbarHorizontal) {
            scrollbarHorizontal.scrollTo(scrollPositionX, scrollPositionY);
          }
        }

        var attachedScrollbarVertical = grid.$config.scrollY;

        if (attachedScrollbarVertical) {
          var scrollbarVertical = gantt.$ui.getView(attachedScrollbarVertical);

          if (scrollbarVertical) {
            scrollbarVertical.scrollTo(scrollPositionX, scrollPositionY);
          }
        }
      }
    },
    keys: {
      "pagedown": function pagedown() {
        if (gantt.getVisibleTaskCount()) {
          this.moveTo(new gantt.$keyboardNavigation.TaskRow(gantt.getTaskByIndex(gantt.getVisibleTaskCount() - 1).id));
        }
      },
      "pageup": function pageup() {
        if (gantt.getVisibleTaskCount()) {
          this.moveTo(new gantt.$keyboardNavigation.TaskRow(gantt.getTaskByIndex(0).id));
        }
      },
      "up": function up() {
        var nextElement = null;
        var prevTask = gantt.getPrev(this.taskId);

        if (!gantt.isTaskExists(prevTask)) {
          nextElement = new gantt.$keyboardNavigation.HeaderCell();
        } else {
          nextElement = new gantt.$keyboardNavigation.TaskRow(prevTask);
        }

        this.moveTo(nextElement);
      },
      "down": function down() {
        var nextTask = gantt.getNext(this.taskId);

        if (gantt.isTaskExists(nextTask)) {
          this.moveTo(new gantt.$keyboardNavigation.TaskRow(nextTask));
        }
      },
      "shift+down": function shiftDown() {
        if (gantt.hasChild(this.taskId) && !gantt.getTask(this.taskId).$open) {
          gantt.open(this.taskId);
        }
      },
      "shift+up": function shiftUp() {
        if (gantt.hasChild(this.taskId) && gantt.getTask(this.taskId).$open) {
          gantt.close(this.taskId);
        }
      },
      "shift+right": function shiftRight() {
        if (gantt.isReadonly(this)) {
          return;
        }

        var prevId = gantt.getPrevSibling(this.taskId);

        if (gantt.isTaskExists(prevId) && !gantt.isChildOf(this.taskId, prevId)) {
          var parent = gantt.getTask(prevId);
          parent.$open = true;
          var result = gantt.moveTask(this.taskId, -1, prevId);
          if (result !== false) gantt.updateTask(this.taskId);
        }
      },
      "shift+left": function shiftLeft() {
        if (gantt.isReadonly(this)) {
          return;
        }

        var parent = gantt.getParent(this.taskId);

        if (gantt.isTaskExists(parent)) {
          var result = gantt.moveTask(this.taskId, gantt.getTaskIndex(parent) + 1, gantt.getParent(parent));
          if (result !== false) gantt.updateTask(this.taskId);
        }
      },
      // select
      "space": function space(e) {
        if (!gantt.isSelectedTask(this.taskId)) {
          gantt.selectTask(this.taskId);
        } else {
          gantt.unselectTask(this.taskId);
        }
      },
      // collapse
      "ctrl+left": function ctrlLeft(e) {
        gantt.close(this.taskId);
      },
      // expand
      "ctrl+right": function ctrlRight(e) {
        gantt.open(this.taskId);
      },
      // delete task
      "delete": function _delete(e) {
        if (gantt.isReadonly(this)) {
          return;
        }

        gantt.$click.buttons["delete"](this.taskId);
      },
      // open lightbox
      "enter": function enter() {
        if (gantt.isReadonly(this)) {
          return;
        }

        gantt.showLightbox(this.taskId);
      },
      // add subtask
      "ctrl+enter": function ctrlEnter() {
        if (gantt.isReadonly(this)) {
          return;
        }

        gantt.createTask({}, this.taskId);
      }
    }
  });
  gantt.$keyboardNavigation.TaskRow.prototype.bindAll(gantt.$keyboardNavigation.TaskRow.prototype.keys);
};