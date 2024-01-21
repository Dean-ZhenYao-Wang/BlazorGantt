var utils = require("../../utils/utils");

var _require = require("../../utils/helpers"),
    replaceValidZeroId = _require.replaceValidZeroId;

var createTasksDatastoreFacade = function createTasksDatastoreFacade() {
  return {
    getTask: function getTask(id) {
      id = replaceValidZeroId(id, this.config.root_id);
      this.assert(id, "Invalid argument for gantt.getTask");
      var task = this.$data.tasksStore.getItem(id);
      this.assert(task, "Task not found id=" + id);
      return task;
    },
    getTaskByTime: function getTaskByTime(from, to) {
      var p = this.$data.tasksStore.getItems();
      var res = [];

      if (!(from || to)) {
        res = p;
      } else {
        from = +from || -Infinity;
        to = +to || Infinity;

        for (var t = 0; t < p.length; t++) {
          var task = p[t];
          if (+task.start_date < to && +task.end_date > from) res.push(task);
        }
      }

      return res;
    },
    isTaskExists: function isTaskExists(id) {
      if (!this.$data || !this.$data.tasksStore) {
        return false;
      }

      return this.$data.tasksStore.exists(id);
    },
    updateTask: function updateTask(id, item) {
      if (!utils.defined(item)) item = this.getTask(id);
      this.$data.tasksStore.updateItem(id, item);
      if (this.isTaskExists(id)) this.refreshTask(id);
    },
    addTask: function addTask(item, parent, index) {
      if (!utils.defined(item.id)) item.id = utils.uid(); //GS-761: assert unique ID

      if (this.isTaskExists(item.id)) {
        var task = this.getTask(item.id);

        if (task.$index != item.$index) {
          // Someone may try to mistakenly add a task with the same ID, and most likely
          // use the string format for the dates. Gantt shouldn't break in this scenario
          if (item.start_date && typeof item.start_date === "string") {
            item.start_date = this.date.parseDate(item.start_date, "parse_date");
          }

          if (item.end_date && typeof item.end_date === "string") {
            item.end_date = this.date.parseDate(item.end_date, "parse_date");
          }

          return this.$data.tasksStore.updateItem(item.id, item);
        }
      }

      if (!utils.defined(parent)) parent = this.getParent(item) || 0;
      if (!this.isTaskExists(parent)) parent = this.config.root_id;
      this.setParent(item, parent);
      return this.$data.tasksStore.addItem(item, index, parent);
    },
    deleteTask: function deleteTask(id) {
      id = replaceValidZeroId(id, this.config.root_id);
      return this.$data.tasksStore.removeItem(id);
    },
    getTaskCount: function getTaskCount() {
      return this.$data.tasksStore.count();
    },
    getVisibleTaskCount: function getVisibleTaskCount() {
      return this.$data.tasksStore.countVisible();
    },
    getTaskIndex: function getTaskIndex(id) {
      return this.$data.tasksStore.getBranchIndex(id);
    },
    getGlobalTaskIndex: function getGlobalTaskIndex(id) {
      id = replaceValidZeroId(id, this.config.root_id);
      this.assert(id, "Invalid argument");
      return this.$data.tasksStore.getIndexById(id);
    },
    eachTask: function eachTask(code, parent, master) {
      return this.$data.tasksStore.eachItem(utils.bind(code, master || this), parent);
    },
    eachParent: function eachParent(callback, startTask, master) {
      return this.$data.tasksStore.eachParent(utils.bind(callback, master || this), startTask);
    },
    changeTaskId: function changeTaskId(oldid, newid) {
      this.$data.tasksStore.changeId(oldid, newid);
      var task = this.$data.tasksStore.getItem(newid);
      var links = [];

      if (task.$source) {
        links = links.concat(task.$source);
      }

      if (task.$target) {
        links = links.concat(task.$target);
      }

      for (var i = 0; i < links.length; i++) {
        var link = this.getLink(links[i]);

        if (link.source == oldid) {
          link.source = newid;
        }

        if (link.target == oldid) {
          link.target = newid;
        }
      }
    },
    calculateTaskLevel: function calculateTaskLevel(item) {
      return this.$data.tasksStore.calculateItemLevel(item);
    },
    getNext: function getNext(id) {
      return this.$data.tasksStore.getNext(id);
    },
    getPrev: function getPrev(id) {
      return this.$data.tasksStore.getPrev(id);
    },
    getParent: function getParent(id) {
      return this.$data.tasksStore.getParent(id);
    },
    setParent: function setParent(task, new_pid, silent) {
      return this.$data.tasksStore.setParent(task, new_pid, silent);
    },
    getSiblings: function getSiblings(id) {
      return this.$data.tasksStore.getSiblings(id).slice();
    },
    getNextSibling: function getNextSibling(id) {
      return this.$data.tasksStore.getNextSibling(id);
    },
    getPrevSibling: function getPrevSibling(id) {
      return this.$data.tasksStore.getPrevSibling(id);
    },
    getTaskByIndex: function getTaskByIndex(index) {
      var id = this.$data.tasksStore.getIdByIndex(index);

      if (this.isTaskExists(id)) {
        return this.getTask(id);
      } else {
        return null;
      }
    },
    getChildren: function getChildren(id) {
      if (!this.hasChild(id)) {
        return [];
      } else {
        return this.$data.tasksStore.getChildren(id).slice();
      }
    },
    hasChild: function hasChild(id) {
      return this.$data.tasksStore.hasChild(id);
    },
    open: function open(id) {
      this.$data.tasksStore.open(id);
    },
    close: function close(id) {
      this.$data.tasksStore.close(id);
    },
    moveTask: function moveTask(sid, tindex, parent) {
      parent = replaceValidZeroId(parent, this.config.root_id);
      return this.$data.tasksStore.move.apply(this.$data.tasksStore, arguments);
    },
    sort: function sort(field, desc, parent, silent) {
      var render = !silent; //4th argument to cancel redraw after sorting

      this.$data.tasksStore.sort(field, desc, parent);
      this.callEvent("onAfterSort", [field, desc, parent]);

      if (render) {
        this.render();
      }
    }
  };
};

module.exports = createTasksDatastoreFacade;