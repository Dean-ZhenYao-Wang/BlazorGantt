var _require = require("../utils/helpers"),
    replaceValidZeroId = _require.replaceValidZeroId;

module.exports = function (gantt) {
  gantt.config.multiselect = true;
  gantt.config.multiselect_one_level = false;
  gantt._multiselect = {
    _selected: {},
    _one_level: false,
    _active: true,
    _first_selected_when_shift: null,
    getDefaultSelected: function getDefaultSelected() {
      var selected = this.getSelected();
      return selected.length ? selected[selected.length - 1] : null;
    },
    setFirstSelected: function setFirstSelected(id) {
      this._first_selected_when_shift = id;
    },
    getFirstSelected: function getFirstSelected() {
      return this._first_selected_when_shift;
    },
    isActive: function isActive() {
      this.updateState();
      return this._active;
    },
    updateState: function updateState() {
      this._one_level = gantt.config.multiselect_one_level;
      var active = this._active;
      this._active = gantt.config.select_task;

      if (this._active != active) {
        this.reset();
      }
    },
    reset: function reset() {
      this._selected = {};
    },
    setLastSelected: function setLastSelected(id) {
      gantt.$data.tasksStore.silent(function () {
        var store = gantt.$data.tasksStore;
        if (id) store.select(id + "");else store.unselect(null);
      });
    },
    getLastSelected: function getLastSelected() {
      var last = gantt.$data.tasksStore.getSelectedId();
      if (last && gantt.isTaskExists(last)) return last;
      return null;
    },
    select: function select(id, e) {
      if (id && gantt.callEvent("onBeforeTaskMultiSelect", [id, true, e]) && gantt.callEvent("onBeforeTaskSelected", [id])) {
        this._selected[id] = true;
        this.setLastSelected(id);
        this.afterSelect(id);
        gantt.callEvent("onTaskMultiSelect", [id, true, e]);
        gantt.callEvent("onTaskSelected", [id]);
        return true;
      }

      return false;
    },
    toggle: function toggle(id, e) {
      if (this._selected[id]) {
        this.unselect(id, e);
      } else {
        this.select(id, e);
      }
    },
    unselect: function unselect(id, e) {
      if (id && gantt.callEvent("onBeforeTaskMultiSelect", [id, false, e])) {
        this._selected[id] = false;
        if (this.getLastSelected() == id) this.setLastSelected(this.getDefaultSelected());
        this.afterSelect(id);
        gantt.callEvent("onTaskMultiSelect", [id, false, e]);
        gantt.callEvent("onTaskUnselected", [id]);
      }
    },
    isSelected: function isSelected(id) {
      return !!(gantt.isTaskExists(id) && this._selected[id]);
    },
    getSelected: function getSelected() {
      var res = [];

      for (var i in this._selected) {
        if (this._selected[i] && gantt.isTaskExists(i)) {
          res.push(i);
        } else {
          this._selected[i] = false;
        }
      }

      res.sort(function (a, b) {
        return gantt.getGlobalTaskIndex(a) > gantt.getGlobalTaskIndex(b) ? 1 : -1;
      });
      return res;
    },
    forSelected: function forSelected(callback) {
      var selected = this.getSelected();

      for (var i = 0; i < selected.length; i++) {
        callback(selected[i]);
      }
    },
    isSameLevel: function isSameLevel(id) {
      if (!this._one_level) return true;
      var last = this.getLastSelected();
      if (!last) return true;
      if (!(gantt.isTaskExists(last) && gantt.isTaskExists(id))) return true;
      return !!(gantt.calculateTaskLevel(gantt.getTask(last)) == gantt.calculateTaskLevel(gantt.getTask(id)));
    },
    afterSelect: function afterSelect(id) {
      if (gantt.isTaskExists(id)) {
        // FIXME: quick workaround to prevent re-filtering inside refresh on multiselect
        gantt._quickRefresh(function () {
          gantt.refreshTask(id);
        });
      }
    },
    doSelection: function doSelection(e) {
      if (!this.isActive()) return false; // deny selection when click on 'expand' or 'collapse' icons

      if (gantt._is_icon_open_click(e)) return false;
      var target_ev = gantt.locate(e);
      if (!target_ev) return false;
      if (!gantt.callEvent("onBeforeMultiSelect", [e])) return false;
      var selected = this.getSelected();
      var defaultLast = this.getFirstSelected();
      var isLast = false;
      var last = this.getLastSelected();
      var multiSelect = gantt.config.multiselect;

      var singleSelection = function () {
        // GS-719: If the multiselect extension is added we still need a way
        // to open the inline editors after clicking on the cells in the grid
        var controller = gantt.ext.inlineEditors;
        var state = controller.getState();
        var cell = controller.locateCell(e.target);

        if (gantt.config.inline_editors_multiselect_open && cell && controller.getEditorConfig(cell.columnName)) {
          if (controller.isVisible() && state.id == cell.id && state.columnName == cell.columnName) {// do nothing if editor is already active in this cell
          } else {
            controller.startEdit(cell.id, cell.columnName);
          }
        }

        this.setFirstSelected(target_ev);

        if (!this.isSelected(target_ev)) {
          this.select(target_ev, e);
        }

        selected = this.getSelected();

        for (var i = 0; i < selected.length; i++) {
          if (selected[i] !== target_ev) {
            this.unselect(selected[i], e);
          }
        }
      }.bind(this);

      var blockSelection = function () {
        if (!last) last = target_ev;else if (target_ev) {
          var first_indx = gantt.getGlobalTaskIndex(this.getFirstSelected());
          var target_indx = gantt.getGlobalTaskIndex(target_ev);
          var last_indx = gantt.getGlobalTaskIndex(last); // clear prev selection

          var tmp = last;

          while (gantt.getGlobalTaskIndex(tmp) !== first_indx) {
            this.unselect(tmp, e);
            tmp = first_indx > last_indx ? gantt.getNext(tmp) : gantt.getPrev(tmp);
          }

          tmp = target_ev;

          while (gantt.getGlobalTaskIndex(tmp) !== first_indx) {
            if (this.select(tmp, e) && !isLast) {
              isLast = true;
              defaultLast = tmp;
            }

            tmp = first_indx > target_indx ? gantt.getNext(tmp) : gantt.getPrev(tmp);
          }
        }
      }.bind(this);

      if (multiSelect && (e.ctrlKey || e.metaKey)) {
        if (!this.isSelected(target_ev)) this.setFirstSelected(target_ev);

        if (target_ev) {
          this.toggle(target_ev, e);
        }
      } else if (multiSelect && e.shiftKey) {
        if (!gantt.isTaskExists(this.getFirstSelected()) || this.getFirstSelected() === null) {
          this.setFirstSelected(target_ev);
        }

        if (selected.length) {
          // select a group of tasks
          blockSelection();
        } else {
          // select a task when no task is selected and Shift is pressed
          singleSelection();
        }
      } else {
        // no key press or no multiple selection on the mouse click
        singleSelection();
      }

      if (this.isSelected(target_ev)) {
        this.setLastSelected(target_ev);
      } else if (defaultLast) {
        if (target_ev == last) this.setLastSelected(e.shiftKey ? defaultLast : this.getDefaultSelected());
      } else {
        this.setLastSelected(null);
      }

      if (!this.getSelected().length) this.setLastSelected(null);
      if (!this.getLastSelected() || !this.isSelected(this.getFirstSelected())) this.setFirstSelected(this.getLastSelected());
      return true;
    }
  };

  (function () {
    var old_selectTask = gantt.selectTask;

    gantt.selectTask = function (id) {
      id = replaceValidZeroId(id, this.config.root_id);
      if (!id) return false;
      var multiselect = gantt._multiselect;
      var res = id;

      if (multiselect.isActive()) {
        if (multiselect.select(id, null)) {
          multiselect.setLastSelected(id);
        }

        multiselect.setFirstSelected(multiselect.getLastSelected());
      } else {
        res = old_selectTask.call(this, id);
      }

      return res;
    };

    var old_unselectTask = gantt.unselectTask;

    gantt.unselectTask = function (id) {
      var multiselect = gantt._multiselect;
      var isActive = multiselect.isActive();
      id = id || multiselect.getLastSelected();

      if (id && isActive) {
        multiselect.unselect(id, null);
        if (id == multiselect.getLastSelected()) multiselect.setLastSelected(null);
        gantt.refreshTask(id);
        multiselect.setFirstSelected(multiselect.getLastSelected());
      }

      var res = id;
      if (!isActive) res = old_unselectTask.call(this, id);
      return res;
    };

    gantt.toggleTaskSelection = function (id) {
      var multiselect = gantt._multiselect;

      if (id && multiselect.isActive()) {
        multiselect.toggle(id);
        multiselect.setFirstSelected(multiselect.getLastSelected());
      }
    };

    gantt.getSelectedTasks = function () {
      var multiselect = gantt._multiselect;
      multiselect.isActive();
      return multiselect.getSelected();
    };

    gantt.eachSelectedTask = function (callback) {
      return this._multiselect.forSelected(callback);
    };

    gantt.isSelectedTask = function (id) {
      return this._multiselect.isSelected(id);
    };

    gantt.getLastSelectedTask = function () {
      return this._multiselect.getLastSelected();
    };

    gantt.attachEvent("onGanttReady", function () {
      var old_isSelected = gantt.$data.tasksStore.isSelected;

      gantt.$data.tasksStore.isSelected = function (id) {
        if (gantt._multiselect.isActive()) {
          return gantt._multiselect.isSelected(id);
        }

        return old_isSelected.call(this, id);
      };
    });
  })();

  gantt.attachEvent("onTaskIdChange", function (id, new_id) {
    var multiselect = gantt._multiselect;
    if (!multiselect.isActive()) return true;

    if (gantt.isSelectedTask(id)) {
      multiselect.unselect(id, null);
      multiselect.select(new_id, null);
    }
  });
  gantt.attachEvent("onAfterTaskDelete", function (id, item) {
    var multiselect = gantt._multiselect;
    if (!multiselect.isActive()) return true;

    if (multiselect._selected[id]) {
      multiselect.unselect(id, null);
      multiselect._selected[id] = false;
      multiselect.setLastSelected(multiselect.getDefaultSelected());
    }

    multiselect.forSelected(function (task_id) {
      if (!gantt.isTaskExists(task_id)) multiselect.unselect(task_id, null);
    });
  });
  gantt.attachEvent("onBeforeTaskMultiSelect", function (id, state, e) {
    var multiselect = gantt._multiselect;

    if (state && multiselect.isActive()) {
      if (multiselect._one_level) {
        return multiselect.isSameLevel(id);
      }
    }

    return true;
  });
  gantt.attachEvent("onTaskClick", function (id, e) {
    if (gantt._multiselect.doSelection(e)) gantt.callEvent("onMultiSelect", [e]);
    return true;
  });
};