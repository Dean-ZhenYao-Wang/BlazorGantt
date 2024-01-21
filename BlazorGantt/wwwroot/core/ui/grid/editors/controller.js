var getKeyboardMapping = require("./keyboard_mappings");

var textEditorFactory = require("./editors/text"),
    numberEditorFactory = require("./editors/number"),
    selectEditorFactory = require("./editors/select"),
    dateEditorFactory = require("./editors/date"),
    predecessorEditorFactory = require("./editors/predecessor"),
    durationEditorFactory = require("./editors/duration");

var utils = require("../../../../utils/utils");

var domHelpers = require("../../utils/dom_helpers");

var eventable = require("../../../../utils/eventable");

var linkedPropertiesProcessor = require("./linked_properties");

function initConfigs(gantt) {
  gantt.config.editor_types = {
    text: new (textEditorFactory(gantt))(),
    number: new (numberEditorFactory(gantt))(),
    select: new (selectEditorFactory(gantt))(),
    date: new (dateEditorFactory(gantt))(),
    predecessor: new (predecessorEditorFactory(gantt))(),
    duration: new (durationEditorFactory(gantt))()
  };
}

function create(gantt) {
  var keyboardMapping = getKeyboardMapping(gantt);
  var eventBus = {};
  eventable(eventBus);

  function createGridEditors(grid) {
    function _getGridCellFromNode(node) {
      if (!domHelpers.isChildOf(node, grid.$grid)) {
        return null;
      }

      var row = domHelpers.locateAttribute(node, grid.$config.item_attribute);
      var cell = domHelpers.locateAttribute(node, "data-column-name");

      if (row && cell) {
        var columnName = cell.getAttribute("data-column-name");
        var id = row.getAttribute(grid.$config.item_attribute);
        return {
          id: id,
          columnName: columnName
        };
      }

      return null;
    }

    function _getEditorPosition(itemId, columnName) {
      var config = grid.$getConfig();
      var top = grid.getItemTop(itemId);
      var height = grid.getItemHeight(itemId);
      var cols = grid.getGridColumns();
      var left = 0,
          right = 0,
          width = 0;

      for (var i = 0; i < cols.length; i++) {
        if (cols[i].name == columnName) {
          width = cols[i].width;
          break;
        }

        if (config.rtl) {
          right += cols[i].width;
        } else {
          left += cols[i].width;
        }
      }

      if (config.rtl) {
        return {
          top: top,
          right: right,
          height: height,
          width: width
        };
      } else {
        return {
          top: top,
          left: left,
          height: height,
          width: width
        };
      }
    }

    function findVisibleIndex(grid, columnName) {
      var columns = grid.getGridColumns();

      for (var i = 0; i < columns.length; i++) {
        if (columns[i].name == columnName) {
          return i;
        }
      }

      return 0;
    }

    function _createPlaceholder(itemId, columnName) {
      var config = grid.$getConfig();

      var pos = _getEditorPosition(itemId, columnName);

      var el = document.createElement("div");
      el.className = "gantt_grid_editor_placeholder";
      el.setAttribute(grid.$config.item_attribute, itemId);
      el.setAttribute(grid.$config.bind + "_id", itemId); // for backward compatibility

      el.setAttribute("data-column-name", columnName);
      var visibleIndex = findVisibleIndex(grid, columnName);
      el.setAttribute("data-column-index", visibleIndex);

      gantt._waiAria.inlineEditorAttr(el);

      if (config.rtl) {
        el.style.cssText = ["top:" + pos.top + "px", "right:" + pos.right + "px", "width:" + pos.width + "px", "height:" + pos.height + "px"].join(";");
      } else {
        el.style.cssText = ["top:" + pos.top + "px", "left:" + pos.left + "px", "width:" + pos.width + "px", "height:" + pos.height + "px"].join(";");
      }

      return el;
    }

    var updateTaskDateProperties = linkedPropertiesProcessor(gantt);
    var handlers = [];
    var ganttHandlers = [];
    var store = null;
    var controller = {
      _itemId: null,
      _columnName: null,
      _editor: null,
      _editorType: null,
      _placeholder: null,
      locateCell: _getGridCellFromNode,
      getEditorConfig: function getEditorConfig(columnName) {
        var column = grid.getColumn(columnName);
        return column.editor;
      },
      init: function init() {
        var mapping = keyboardMapping.getMapping();

        if (mapping.init) {
          mapping.init(this, grid);
        }

        store = grid.$gantt.getDatastore(grid.$config.bind);
        var self = this;
        handlers.push(store.attachEvent("onIdChange", function (oldId, newId) {
          if (self._itemId == oldId) {
            self._itemId = newId;
          }
        }));
        handlers.push(store.attachEvent("onStoreUpdated", function () {
          if (grid.$gantt.getState("batchUpdate").batch_update) {
            return;
          }

          if (self.isVisible() && !store.isVisible(self._itemId)) {
            self.hide();
          }
        }));
        ganttHandlers.push(gantt.attachEvent("onDataRender", function () {
          if (self._editor && self._placeholder && !domHelpers.isChildOf(self._placeholder, gantt.$root)) {
            grid.$grid_data.appendChild(self._placeholder);
          }
        }));

        this.init = function () {};
      },
      getState: function getState() {
        return {
          editor: this._editor,
          editorType: this._editorType,
          placeholder: this._placeholder,
          id: this._itemId,
          columnName: this._columnName
        };
      },
      startEdit: function startEdit(itemId, columnName) {
        if (this.isVisible()) {
          this.save();
        }

        if (!store.exists(itemId)) {
          return;
        }

        var editorState = {
          id: itemId,
          columnName: columnName
        };

        if (gantt.isReadonly(store.getItem(itemId))) {
          this.callEvent("onEditPrevent", [editorState]);
          return;
        }

        if (this.callEvent("onBeforeEditStart", [editorState]) === false) {
          this.callEvent("onEditPrevent", [editorState]);
          return;
        }

        this.show(editorState.id, editorState.columnName);
        this.setValue();
        this.callEvent("onEditStart", [editorState]);
      },
      isVisible: function isVisible() {
        return !!(this._editor && domHelpers.isChildOf(this._placeholder, gantt.$root));
      },
      show: function show(itemId, columnName) {
        if (this.isVisible()) {
          this.save();
        }

        var editorState = {
          id: itemId,
          columnName: columnName
        };
        var column = grid.getColumn(editorState.columnName);
        var editorConfig = this.getEditorConfig(column.name);
        if (!editorConfig) return;
        var editor = grid.$getConfig().editor_types[editorConfig.type];

        var placeholder = _createPlaceholder(editorState.id, editorState.columnName);

        grid.$grid_data.appendChild(placeholder);
        editor.show(editorState.id, column, editorConfig, placeholder);
        this._editor = editor;
        this._placeholder = placeholder;
        this._itemId = editorState.id;
        this._columnName = editorState.columnName;
        this._editorType = editorConfig.type;
        var mapping = keyboardMapping.getMapping();

        if (mapping.onShow) {
          mapping.onShow(this, placeholder, grid);
        }
      },
      setValue: function setValue() {
        var state = this.getState();
        var itemId = state.id,
            columnName = state.columnName;
        var column = grid.getColumn(columnName);
        var item = store.getItem(itemId);
        var editorConfig = this.getEditorConfig(columnName);
        if (!editorConfig) return;
        var value = item[editorConfig.map_to];

        if (editorConfig.map_to == "auto") {
          value = store.getItem(itemId);
        }

        this._editor.set_value(value, itemId, column, this._placeholder);

        this.focus();
      },
      focus: function focus() {
        this._editor.focus(this._placeholder);
      },
      getValue: function getValue() {
        var column = grid.getColumn(this._columnName);
        return this._editor.get_value(this._itemId, column, this._placeholder);
      },
      _getItemValue: function _getItemValue() {
        var editorConfig = this.getEditorConfig(this._columnName);
        if (!editorConfig) return;
        var item = gantt.getTask(this._itemId);
        var value = item[editorConfig.map_to];

        if (editorConfig.map_to == "auto") {
          value = store.getItem(this._itemId);
        }

        return value;
      },
      isChanged: function isChanged() {
        var column = grid.getColumn(this._columnName);

        var value = this._getItemValue();

        return this._editor.is_changed(value, this._itemId, column, this._placeholder);
      },
      hide: function hide() {
        if (!this._itemId) return;
        var itemId = this._itemId,
            columnName = this._columnName;
        var mapping = keyboardMapping.getMapping();

        if (mapping.onHide) {
          mapping.onHide(this, this._placeholder, grid);
        }

        this._itemId = null;
        this._columnName = null;
        this._editorType = null;
        if (!this._placeholder) return;

        if (this._editor && this._editor.hide) {
          this._editor.hide(this._placeholder);
        }

        this._editor = null;

        if (this._placeholder.parentNode) {
          this._placeholder.parentNode.removeChild(this._placeholder);
        }

        this._placeholder = null;
        this.callEvent("onEditEnd", [{
          id: itemId,
          columnName: columnName
        }]);
      },
      save: function save() {
        if (!(this.isVisible() && store.exists(this._itemId) && this.isChanged())) {
          this.hide();
          return;
        }

        var itemId = this._itemId,
            columnName = this._columnName;

        if (!store.exists(itemId)) {
          return;
        }

        var item = store.getItem(itemId);
        var editorConfig = this.getEditorConfig(columnName);
        var editorState = {
          id: itemId,
          columnName: columnName,
          newValue: this.getValue(),
          oldValue: this._getItemValue()
        };

        if (this.callEvent("onBeforeSave", [editorState]) !== false) {
          if (!this._editor.is_valid || this._editor.is_valid(editorState.newValue, editorState.id, grid.getColumn(columnName), this._placeholder)) {
            var mapTo = editorConfig.map_to;
            var value = editorState.newValue;

            if (mapTo != "auto") {
              item[mapTo] = value;
              updateTaskDateProperties(item, mapTo, gantt.config.inline_editors_date_processing);
              store.updateItem(itemId);
            } else {
              this._editor.save(itemId, grid.getColumn(columnName), this._placeholder);
            }

            this.callEvent("onSave", [editorState]);
          }
        }

        this.hide();
      },
      _findEditableCell: function findEditableCell(start, direction) {
        var nextIndex = start;
        var columns = grid.getGridColumns();
        var nextColumn = columns[nextIndex];
        var columnName = nextColumn ? nextColumn.name : null;

        if (columnName) {
          while (columnName && !this.getEditorConfig(columnName)) {
            columnName = this._findEditableCell(start + direction, direction);
          }

          return columnName;
        }

        return null;
      },
      getNextCell: function moveCell(dir) {
        // GS-1257. true means to exclude hidden columns
        return this._findEditableCell(grid.getColumnIndex(this._columnName, true) + dir, dir);
      },
      getFirstCell: function getFirstCell() {
        return this._findEditableCell(0, 1);
      },
      getLastCell: function getLastCell() {
        return this._findEditableCell(grid.getGridColumns().length - 1, -1);
      },
      editNextCell: function nextCell(canChangeRow) {
        var cell = this.getNextCell(1);

        if (cell) {
          var nextColumn = this.getNextCell(1);

          if (nextColumn && this.getEditorConfig(nextColumn)) {
            this.startEdit(this._itemId, nextColumn);
          }
        } else if (canChangeRow && this.moveRow(1)) {
          var task = this.moveRow(1);
          cell = this.getFirstCell();

          if (cell && this.getEditorConfig(cell)) {
            this.startEdit(task, cell);
          }
        }
      },
      editPrevCell: function prevCell(canChangeRow) {
        var cell = this.getNextCell(-1);

        if (cell) {
          var nextColumn = this.getNextCell(-1);

          if (nextColumn && this.getEditorConfig(nextColumn)) {
            this.startEdit(this._itemId, nextColumn);
          }
        } else if (canChangeRow && this.moveRow(-1)) {
          var task = this.moveRow(-1);
          cell = this.getLastCell();

          if (cell && this.getEditorConfig(cell)) {
            this.startEdit(task, cell);
          }
        }
      },
      moveRow: function moveRow(dir) {
        var moveTask = dir > 0 ? gantt.getNext : gantt.getPrev;
        moveTask = gantt.bind(moveTask, gantt);
        var nextItem = moveTask(this._itemId); // skip readonly rows

        while (gantt.isTaskExists(nextItem) && gantt.isReadonly(gantt.getTask(nextItem))) {
          nextItem = moveTask(nextItem);
        }

        return nextItem;
      },
      editNextRow: function nextRow(skipReadonly) {
        var id = this.getState().id;
        if (!gantt.isTaskExists(id)) return;
        var next = null;

        if (skipReadonly) {
          next = this.moveRow(1);
        } else {
          next = gantt.getNext(id);
        }

        if (gantt.isTaskExists(next)) {
          this.startEdit(next, this._columnName);
        }
      },
      editPrevRow: function prevRow(skipReadonly) {
        var id = this.getState().id;
        if (!gantt.isTaskExists(id)) return;
        var prev = null;

        if (skipReadonly) {
          prev = this.moveRow(-1);
        } else {
          prev = gantt.getPrev(id);
        }

        if (gantt.isTaskExists(prev)) {
          this.startEdit(prev, this._columnName);
        }
      },
      destructor: function destructor() {
        handlers.forEach(function (handlerId) {
          store.detachEvent(handlerId);
        });
        ganttHandlers.forEach(function (handlerId) {
          gantt.detachEvent(handlerId);
        });
        handlers = [];
        ganttHandlers = [];
        store = null;
        this.hide();
        this.detachAllEvents();
      }
    };
    utils.mixin(controller, keyboardMapping);
    utils.mixin(controller, eventBus);
    return controller;
  }

  var inlineEditController = {
    init: initConfigs,
    createEditors: createGridEditors
  };
  utils.mixin(inlineEditController, keyboardMapping);
  utils.mixin(inlineEditController, eventBus);
  return inlineEditController;
}

module.exports = create;