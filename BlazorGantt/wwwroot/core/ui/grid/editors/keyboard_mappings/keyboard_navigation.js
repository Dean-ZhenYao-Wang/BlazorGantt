module.exports = {
  init: function init(controller, grid) {
    var self = controller;
    var gantt = grid.$gantt;
    var onBlurDelay = null;
    var keyNav = gantt.ext.keyboardNavigation;
    keyNav.attachEvent("onBeforeFocus", function (node) {
      var activeCell = controller.locateCell(node);
      clearTimeout(onBlurDelay);

      if (activeCell) {
        var columnName = activeCell.columnName;
        var id = activeCell.id;
        var editorState = self.getState();

        if (self.isVisible()) {
          if (editorState.id == id && editorState.columnName === columnName) {
            return false;
          }
        }
      }

      return true;
    });
    keyNav.attachEvent("onFocus", function (node) {
      var activeCell = controller.locateCell(node);
      var state = controller.getState();
      clearTimeout(onBlurDelay);

      if (activeCell && !(activeCell.id == state.id && activeCell.columnName == state.columnName)) {
        if (self.isVisible()) {
          self.save();
        }
      }

      return true;
    });
    controller.attachEvent("onHide", function () {
      clearTimeout(onBlurDelay);
    });
    keyNav.attachEvent("onBlur", function () {
      onBlurDelay = setTimeout(function () {
        self.save();
      });
      return true;
    });
    gantt.attachEvent("onTaskDblClick", function (id, e) {
      // block lightbox on double click inside editor
      var state = controller.getState();
      var cell = controller.locateCell(e.target);

      if (cell && controller.isVisible() && cell.columnName == state.columnName) {
        return false;
      }

      return true;
    });
    gantt.attachEvent("onTaskClick", function (id, e) {
      if (gantt._is_icon_open_click(e)) return true;
      var state = controller.getState();
      var cell = controller.locateCell(e.target);

      if (cell && controller.getEditorConfig(cell.columnName)) {
        if (controller.isVisible() && state.id == cell.id && state.columnName == cell.columnName) {// do nothing if editor is already active in this cell
        } else {
          controller.startEdit(cell.id, cell.columnName);
        }

        return false;
      }

      return true;
    });
    gantt.attachEvent("onEmptyClick", function () {
      self.save();
      return true;
    });
    keyNav.attachEvent("onKeyDown", function (command, e) {
      var activeCell = controller.locateCell(e.target);
      var hasEditor = activeCell ? controller.getEditorConfig(activeCell.columnName) : false;
      var state = controller.getState();
      var keyboard = gantt.constants.KEY_CODES;
      var keyCode = e.keyCode;
      var preventKeyNav = false;

      switch (keyCode) {
        case keyboard.ENTER:
          if (controller.isVisible()) {
            controller.save();
            e.preventDefault();
            preventKeyNav = true;
          } else if (hasEditor && !(e.ctrlKey || e.metaKey || e.shiftKey)) {
            self.startEdit(activeCell.id, activeCell.columnName);
            e.preventDefault();
            preventKeyNav = true;
          }

          break;

        case keyboard.ESC:
          if (controller.isVisible()) {
            controller.hide();
            e.preventDefault();
            preventKeyNav = true;
          }

          break;

        case keyboard.UP:
        case keyboard.DOWN:
          break;

        case keyboard.LEFT:
        case keyboard.RIGHT:
          if (hasEditor && controller.isVisible() || state.editorType === "date") {
            preventKeyNav = true;
          }

          break;

        case keyboard.SPACE:
          if (controller.isVisible()) {
            preventKeyNav = true;
          }

          if (hasEditor && !controller.isVisible()) {
            self.startEdit(activeCell.id, activeCell.columnName);
            e.preventDefault();
            preventKeyNav = true;
          }

          break;

        case keyboard.DELETE:
          if (hasEditor && !controller.isVisible()) {
            self.startEdit(activeCell.id, activeCell.columnName);
            preventKeyNav = true;
          } else if (hasEditor && controller.isVisible()) {
            preventKeyNav = true;
          }

          break;

        case keyboard.TAB:
          if (controller.isVisible()) {
            if (e.shiftKey) {
              controller.editPrevCell(true);
            } else {
              controller.editNextCell(true);
            }

            var newState = controller.getState();

            if (newState.id) {
              keyNav.focus({
                type: "taskCell",
                id: newState.id,
                column: newState.columnName
              });
            }

            e.preventDefault();
            preventKeyNav = true;
          }

          break;

        default:
          if (controller.isVisible()) preventKeyNav = true;else {
            // start editing on character key
            if (keyCode >= 48 && keyCode <= 57 || // [0-9]
            keyCode > 95 && keyCode < 112 || // numpad
            keyCode >= 64 && keyCode <= 91 || // [a-z]
            keyCode > 185 && keyCode < 193 || //;=-,etc
            keyCode > 218 && keyCode < 223) {
              var modifiers = command.modifiers;
              var anyModifier = modifiers.alt || modifiers.ctrl || modifiers.meta || modifiers.shift;

              if (modifiers.alt) {// don't start editing on alt+key
              } else if (anyModifier && keyNav.getCommandHandler(command, "taskCell")) {// don't start editing if command already have a keyboard shortcut
              } else if (hasEditor && !controller.isVisible()) {
                self.startEdit(activeCell.id, activeCell.columnName);
                preventKeyNav = true;
              }
            }
          }
          break;
      }

      if (preventKeyNav) {
        return false;
      } else {
        return true;
      }
    });
  },
  onShow: function onShow(controller, placeholder, grid) {},
  onHide: function onHide(controller, placeholder, grid) {
    var gantt = grid.$gantt;
    gantt.focus();
  },
  destroy: function destroy() {}
};