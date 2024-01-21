module.exports = function (gantt) {
  var domHelpers = require("../../../core/ui/utils/dom_helpers");

  gantt.$keyboardNavigation.HeaderCell = function (index) {
    this.index = index || 0;
  };

  gantt.$keyboardNavigation.HeaderCell.prototype = gantt._compose(gantt.$keyboardNavigation.KeyNavNode, {
    _handlers: null,
    isValid: function isValid() {
      if (!gantt.config.show_grid) {
        if (gantt.getVisibleTaskCount()) return false;
      }

      return !!gantt.getGridColumns()[this.index] || !gantt.getVisibleTaskCount();
    },
    fallback: function fallback() {
      if (!gantt.config.show_grid) {
        if (gantt.getVisibleTaskCount()) {
          return new gantt.$keyboardNavigation.TaskRow();
        }

        return null;
      }

      var visibleColumns = gantt.getGridColumns();
      var index = this.index;

      while (index >= 0) {
        if (visibleColumns[index]) break;
        index--;
      }

      if (visibleColumns[index]) {
        return new gantt.$keyboardNavigation.HeaderCell(index);
      } else {
        return null;
      }
    },
    fromDomElement: function fromDomElement(el) {
      var cellElement = domHelpers.locateClassName(el, "gantt_grid_head_cell");

      if (cellElement) {
        var index = 0;

        while (cellElement && cellElement.previousSibling) {
          cellElement = cellElement.previousSibling;
          index += 1;
        }

        return new gantt.$keyboardNavigation.HeaderCell(index);
      } else {
        return null;
      }
    },
    getNode: function getNode() {
      var cells = gantt.$grid_scale.childNodes;
      return cells[this.index];
    },
    keys: {
      "left": function left() {
        if (this.index > 0) {
          this.moveTo(new gantt.$keyboardNavigation.HeaderCell(this.index - 1));
        }
      },
      "right": function right() {
        var columns = gantt.getGridColumns();

        if (this.index < columns.length - 1) {
          this.moveTo(new gantt.$keyboardNavigation.HeaderCell(this.index + 1));
        }
      },
      "down": function down() {
        var taskRow;
        var rootLevel = gantt.getChildren(gantt.config.root_id);

        if (gantt.isTaskExists(rootLevel[0])) {
          taskRow = rootLevel[0];
        }

        if (taskRow) {
          if (gantt.config.keyboard_navigation_cells) {
            this.moveTo(new gantt.$keyboardNavigation.TaskCell(taskRow, this.index));
          } else {
            this.moveTo(new gantt.$keyboardNavigation.TaskRow(taskRow));
          }
        }
      },
      "end": function end() {
        var columns = gantt.getGridColumns();
        this.moveTo(new gantt.$keyboardNavigation.HeaderCell(columns.length - 1));
      },
      "home": function home() {
        this.moveTo(new gantt.$keyboardNavigation.HeaderCell(0));
      },
      // press header button
      "enter, space": function enterSpace() {
        var node = domHelpers.getActiveElement();
        node.click();
      },
      // add new task
      "ctrl+enter": function ctrlEnter() {
        if (gantt.isReadonly(this)) {
          return;
        }

        gantt.createTask({}, this.taskId);
      }
    }
  });
  gantt.$keyboardNavigation.HeaderCell.prototype.bindAll(gantt.$keyboardNavigation.HeaderCell.prototype.keys);
};