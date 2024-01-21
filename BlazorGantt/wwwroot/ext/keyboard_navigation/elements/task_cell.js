module.exports = function (gantt) {
  var domHelpers = require("../../../core/ui/utils/dom_helpers");

  var _require = require("../../../utils/helpers"),
      replaceValidZeroId = _require.replaceValidZeroId;

  gantt.$keyboardNavigation.TaskCell = function (taskId, index) {
    taskId = replaceValidZeroId(taskId, gantt.config.root_id);

    if (!taskId) {
      var rootLevel = gantt.getChildren(gantt.config.root_id);

      if (rootLevel[0]) {
        taskId = rootLevel[0];
      }
    }

    this.taskId = taskId;
    this.columnIndex = index || 0; // provided task may not exist, in this case node will be detectes as invalid

    if (gantt.isTaskExists(this.taskId)) {
      this.index = gantt.getTaskIndex(this.taskId);
      this.globalIndex = gantt.getGlobalTaskIndex(this.taskId);
    }
  };

  gantt.$keyboardNavigation.TaskCell.prototype = gantt._compose(gantt.$keyboardNavigation.TaskRow, {
    _handlers: null,
    isValid: function isValid() {
      return gantt.$keyboardNavigation.TaskRow.prototype.isValid.call(this) && !!gantt.getGridColumns()[this.columnIndex];
    },
    fallback: function fallback() {
      var node = gantt.$keyboardNavigation.TaskRow.prototype.fallback.call(this);
      var result = node;

      if (node instanceof gantt.$keyboardNavigation.TaskRow) {
        var visibleColumns = gantt.getGridColumns();
        var index = this.columnIndex;

        while (index >= 0) {
          if (visibleColumns[index]) break;
          index--;
        }

        if (visibleColumns[index]) {
          result = new gantt.$keyboardNavigation.TaskCell(node.taskId, index);
        }
      }

      return result;
    },
    fromDomElement: function fromDomElement(el) {
      if (!gantt.config.keyboard_navigation_cells) {
        return null;
      }

      var taskId = gantt.locate(el);

      if (gantt.isTaskExists(taskId)) {
        var index = 0;
        var cellElement = domHelpers.locateAttribute(el, "data-column-index");

        if (cellElement) {
          index = cellElement.getAttribute("data-column-index") * 1;
        }

        return new gantt.$keyboardNavigation.TaskCell(taskId, index);
      } else {
        return null;
      }
    },
    getNode: function getNode() {
      if (gantt.isTaskExists(this.taskId) && gantt.isTaskVisible(this.taskId)) {
        if (gantt.config.show_grid) {
          var row = gantt.$grid.querySelector(".gantt_row[" + gantt.config.task_attribute + "='" + this.taskId + "']");
          if (!row) return null;
          return row.querySelector("[data-column-index='" + this.columnIndex + "']");
        } else {
          return gantt.getTaskNode(this.taskId);
        }
      }
    },
    keys: {
      "up": function up() {
        var nextElement = null;
        var prevTask = gantt.getPrev(this.taskId);

        if (!gantt.isTaskExists(prevTask)) {
          nextElement = new gantt.$keyboardNavigation.HeaderCell(this.columnIndex);
        } else {
          nextElement = new gantt.$keyboardNavigation.TaskCell(prevTask, this.columnIndex);
        }

        this.moveTo(nextElement);
      },
      "down": function down() {
        var nextTask = gantt.getNext(this.taskId);

        if (gantt.isTaskExists(nextTask)) {
          this.moveTo(new gantt.$keyboardNavigation.TaskCell(nextTask, this.columnIndex));
        }
      },
      "left": function left() {
        if (this.columnIndex > 0) {
          this.moveTo(new gantt.$keyboardNavigation.TaskCell(this.taskId, this.columnIndex - 1));
        }
      },
      "right": function right() {
        var columns = gantt.getGridColumns();

        if (this.columnIndex < columns.length - 1) {
          this.moveTo(new gantt.$keyboardNavigation.TaskCell(this.taskId, this.columnIndex + 1));
        }
      },
      "end": function end() {
        var columns = gantt.getGridColumns();
        this.moveTo(new gantt.$keyboardNavigation.TaskCell(this.taskId, columns.length - 1));
      },
      "home": function home() {
        this.moveTo(new gantt.$keyboardNavigation.TaskCell(this.taskId, 0));
      },
      "pagedown": function pagedown() {
        if (gantt.getVisibleTaskCount()) {
          this.moveTo(new gantt.$keyboardNavigation.TaskCell(gantt.getTaskByIndex(gantt.getVisibleTaskCount() - 1).id, this.columnIndex));
        }
      },
      "pageup": function pageup() {
        if (gantt.getVisibleTaskCount()) {
          this.moveTo(new gantt.$keyboardNavigation.TaskCell(gantt.getTaskByIndex(0).id, this.columnIndex));
        }
      }
    }
  });
  gantt.$keyboardNavigation.TaskCell.prototype.bindAll(gantt.$keyboardNavigation.TaskRow.prototype.keys);
  gantt.$keyboardNavigation.TaskCell.prototype.bindAll(gantt.$keyboardNavigation.TaskCell.prototype.keys);
};