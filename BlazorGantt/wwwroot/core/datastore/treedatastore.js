var powerArray = require("./power_array");

var utils = require("../../utils/utils");

var helpers = require("../../utils/helpers");

var DataStore = require("./datastore");

var isPlaceholderTask = require("../../utils/placeholder_task");

var _require = require("../../utils/helpers"),
    replaceValidZeroId = _require.replaceValidZeroId; // TODO: remove workaround for mixup with es5 and ts imports


if (DataStore["default"]) {
  DataStore = DataStore["default"];
}

var TreeDataStore = function TreeDataStore(config) {
  DataStore.apply(this, [config]);
  this._branches = {};
  this.pull = {}; //GS-761 Update existing item instead of adding it to the new position

  this.$initItem = function (item) {
    var loadedItem = item;

    if (config.initItem) {
      loadedItem = config.initItem(loadedItem);
    }

    var existingItem = this.getItem(item.id);

    if (existingItem && existingItem.parent != loadedItem.parent) {
      this.move(loadedItem.id, loadedItem.$index || -1, loadedItem.parent || this._ganttConfig.root_id);
    }

    return loadedItem;
  };

  this.$parentProperty = config.parentProperty || "parent";

  if (typeof config.rootId !== "function") {
    this.$getRootId = function (val) {
      return function () {
        return val;
      };
    }(config.rootId || 0);
  } else {
    this.$getRootId = config.rootId;
  } // TODO: replace with live reference to gantt config


  this.$openInitially = config.openInitially;
  this.visibleOrder = powerArray.$create();
  this.fullOrder = powerArray.$create();
  this._searchVisibleOrder = {};
  this._indexRangeCache = {};
  this._eachItemMainRangeCache = null;
  this._getItemsCache = null;
  this._skip_refresh = false;
  this._ganttConfig = null;

  if (config.getConfig) {
    this._ganttConfig = config.getConfig();
  }

  var splitParents = {};
  var splitItems = {};
  var taskOpenState = {};
  var taskVisibility = {};
  var haveSplitItems = false;

  this._attachDataChange(function () {
    this._indexRangeCache = {};
    this._eachItemMainRangeCache = null;
    this._getItemsCache = null;
    return true;
  });

  this.attachEvent("onPreFilter", function () {
    this._indexRangeCache = {};
    this._eachItemMainRangeCache = null;
    splitParents = {};
    splitItems = {};
    taskOpenState = {};
    taskVisibility = {};
    haveSplitItems = false;
    this.eachItem(function (item) {
      var parent = this.getParent(item.id);

      if (item.$open && taskOpenState[parent] !== false) {
        taskOpenState[item.id] = true;
      } else {
        taskOpenState[item.id] = false;
      }

      if (this._isSplitItem(item)) {
        haveSplitItems = true;
        splitParents[item.id] = true;
        splitItems[item.id] = true;
      }

      if (haveSplitItems && splitItems[parent]) {
        splitItems[item.id] = true;
      }

      if (taskOpenState[parent] || taskOpenState[parent] === undefined) {
        taskVisibility[item.id] = true;
      } else {
        taskVisibility[item.id] = false;
      }
    });
  });
  this.attachEvent("onFilterItem", function (id, item) {
    var canOpenSplitTasks = false;

    if (this._ganttConfig) {
      var canOpenSplitTasks = this._ganttConfig.open_split_tasks;
    }

    var open = taskVisibility[item.id];

    if (haveSplitItems) {
      if (open && splitItems[item.id] && !splitParents[item.id]) {
        open = !!canOpenSplitTasks;
      }

      if (splitItems[item.id] && !splitParents[item.id]) {
        item.$split_subtask = true;
      }
    }

    item.$expanded_branch = !!taskVisibility[item.id];
    return !!open;
  });
  this.attachEvent("onFilter", function () {
    splitParents = {};
    splitItems = {};
    taskOpenState = {};
    taskVisibility = {};
  });
  return this;
};

TreeDataStore.prototype = utils.mixin({
  _buildTree: function _buildTree(data) {
    var item = null;
    var rootId = this.$getRootId();

    for (var i = 0, len = data.length; i < len; i++) {
      item = data[i];
      this.setParent(item, replaceValidZeroId(this.getParent(item), rootId) || rootId);
    } // calculating $level for each item


    for (var i = 0, len = data.length; i < len; i++) {
      item = data[i];

      this._add_branch(item);

      item.$level = this.calculateItemLevel(item);
      item.$local_index = this.getBranchIndex(item.id);

      if (!utils.defined(item.$open)) {
        item.$open = utils.defined(item.open) ? item.open : this.$openInitially();
      }
    }

    this._updateOrder();
  },
  _isSplitItem: function _isSplitItem(item) {
    return item.render == "split" && this.hasChild(item.id);
  },
  parse: function parse(data) {
    if (!this._skip_refresh) {
      this.callEvent("onBeforeParse", [data]);
    }

    var loaded = this._parseInner(data);

    this._buildTree(loaded);

    this.filter();

    if (!this._skip_refresh) {
      this.callEvent("onParse", [loaded]);
    }
  },
  _addItemInner: function _addItemInner(item, index) {
    var parent = this.getParent(item);

    if (!utils.defined(parent)) {
      parent = this.$getRootId();
      this.setParent(item, parent);
    }

    var parentIndex = this.getIndexById(parent);
    var targetIndex = parentIndex + Math.min(Math.max(index, 0), this.visibleOrder.length);

    if (targetIndex * 1 !== targetIndex) {
      targetIndex = undefined;
    }

    DataStore.prototype._addItemInner.call(this, item, targetIndex);

    this.setParent(item, parent);

    if (item.hasOwnProperty("$rendered_parent")) {
      this._move_branch(item, item.$rendered_parent);
    }

    this._add_branch(item, index);
  },
  _changeIdInner: function _changeIdInner(oldId, newId) {
    var children = this.getChildren(oldId);
    var visibleOrder = this._searchVisibleOrder[oldId];

    DataStore.prototype._changeIdInner.call(this, oldId, newId);

    var parent = this.getParent(newId);

    this._replace_branch_child(parent, oldId, newId);

    if (this._branches[oldId]) {
      this._branches[newId] = this._branches[oldId];
    }

    for (var i = 0; i < children.length; i++) {
      var child = this.getItem(children[i]);
      child[this.$parentProperty] = newId;
      child.$rendered_parent = newId;
    }

    this._searchVisibleOrder[newId] = visibleOrder;
    delete this._branches[oldId];
  },
  _traverseBranches: function _traverseBranches(code, parent) {
    if (!utils.defined(parent)) {
      parent = this.$getRootId();
    }

    var branch = this._branches[parent];

    if (branch) {
      for (var i = 0; i < branch.length; i++) {
        var itemId = branch[i];
        code.call(this, itemId);
        if (this._branches[itemId]) this._traverseBranches(code, itemId);
      }
    }
  },
  _updateOrder: function _updateOrder(code) {
    this.fullOrder = powerArray.$create();

    this._traverseBranches(function (taskId) {
      this.fullOrder.push(taskId);
    });

    if (code) DataStore.prototype._updateOrder.call(this, code);
  },
  _removeItemInner: function _removeItemInner(id) {
    var items = [];
    this.eachItem(function (child) {
      items.push(child);
    }, id);
    items.push(this.getItem(id));

    for (var i = 0; i < items.length; i++) {
      this._move_branch(items[i], this.getParent(items[i]), null);

      DataStore.prototype._removeItemInner.call(this, items[i].id);

      this._move_branch(items[i], this.getParent(items[i]), null);
    }
  },
  move: function move(sid, tindex, parent) {
    //target id as 4th parameter
    var id = arguments[3];
    var config = this._ganttConfig || {};
    var root_id = config.root_id || 0;
    id = replaceValidZeroId(id, root_id);

    if (id) {
      if (id === sid) return;
      parent = this.getParent(id);
      tindex = this.getBranchIndex(id);
    }

    if (sid == parent) {
      return;
    }

    if (!utils.defined(parent)) {
      parent = this.$getRootId();
    }

    var source = this.getItem(sid);
    var source_pid = this.getParent(source.id);
    var tbranch = this.getChildren(parent);
    if (tindex == -1) tindex = tbranch.length + 1;

    if (source_pid == parent) {
      var sindex = this.getBranchIndex(sid);
      if (sindex == tindex) return;
    }

    if (this.callEvent("onBeforeItemMove", [sid, parent, tindex]) === false) return false;
    var placeholderIds = [];

    for (var i = 0; i < tbranch.length; i++) {
      if (isPlaceholderTask(tbranch[i], null, this, this._ganttConfig)) {
        placeholderIds.push(tbranch[i]);
        tbranch.splice(i, 1);
        i--;
      }
    }

    this._replace_branch_child(source_pid, sid);

    tbranch = this.getChildren(parent);
    var tid = tbranch[tindex];
    tid = replaceValidZeroId(tid, root_id);
    if (!tid) //adding as last element
      tbranch.push(sid);else tbranch = tbranch.slice(0, tindex).concat([sid]).concat(tbranch.slice(tindex));

    if (placeholderIds.length) {
      tbranch = tbranch.concat(placeholderIds);
    }

    this.setParent(source, parent);
    this._branches[parent] = tbranch;
    var diff = this.calculateItemLevel(source) - source.$level;
    source.$level += diff;
    this.eachItem(function (item) {
      item.$level += diff;
    }, source.id, this);

    this._moveInner(this.getIndexById(sid), this.getIndexById(parent) + tindex);

    this.callEvent("onAfterItemMove", [sid, parent, tindex]);
    this.refresh();
  },
  getBranchIndex: function getBranchIndex(id) {
    var branch = this.getChildren(this.getParent(id));
    var index = branch.indexOf(id + "");

    if (index == -1) {
      index = branch.indexOf(+id);
    }

    return index;
  },
  hasChild: function hasChild(id) {
    var branch = this._branches[id];
    return branch && branch.length;
  },
  getChildren: function getChildren(id) {
    var branch = this._branches[id];
    return branch ? branch : powerArray.$create();
  },
  isChildOf: function isChildOf(childId, parentId) {
    if (!this.exists(childId)) return false;
    if (parentId === this.$getRootId()) return true;
    if (!this.hasChild(parentId)) return false;
    var item = this.getItem(childId);
    var pid = this.getParent(childId);
    var parent = this.getItem(parentId);

    if (parent.$level >= item.$level) {
      return false;
    }

    while (item && this.exists(pid)) {
      item = this.getItem(pid);
      if (item && item.id == parentId) return true;
      pid = this.getParent(item);
    }

    return false;
  },
  getSiblings: function getSiblings(id) {
    if (!this.exists(id)) {
      return powerArray.$create();
    }

    var parent = this.getParent(id);
    return this.getChildren(parent);
  },
  getNextSibling: function getNextSibling(id) {
    var siblings = this.getSiblings(id);

    for (var i = 0, len = siblings.length; i < len; i++) {
      if (siblings[i] == id) {
        var nextSibling = siblings[i + 1];

        if (nextSibling === 0 && i > 0) {
          nextSibling = "0";
        }

        return nextSibling || null;
      }
    }

    return null;
  },
  getPrevSibling: function getPrevSibling(id) {
    var siblings = this.getSiblings(id);

    for (var i = 0, len = siblings.length; i < len; i++) {
      if (siblings[i] == id) {
        var previousSibling = siblings[i - 1];

        if (previousSibling === 0 && i > 0) {
          previousSibling = "0";
        }

        return previousSibling || null;
      }
    }

    return null;
  },
  getParent: function getParent(id) {
    var item = null;

    if (id.id !== undefined) {
      item = id;
    } else {
      item = this.getItem(id);
    }

    var parent;

    if (item) {
      parent = item[this.$parentProperty];
    } else {
      parent = this.$getRootId();
    }

    return parent;
  },
  clearAll: function clearAll() {
    this._branches = {};
    DataStore.prototype.clearAll.call(this);
  },
  calculateItemLevel: function calculateItemLevel(item) {
    var level = 0;
    this.eachParent(function () {
      level++;
    }, item);
    return level;
  },
  _setParentInner: function _setParentInner(item, new_pid, silent) {
    if (!silent) {
      if (item.hasOwnProperty("$rendered_parent")) {
        this._move_branch(item, item.$rendered_parent, new_pid);
      } else {
        this._move_branch(item, item[this.$parentProperty], new_pid);
      }
    }
  },
  setParent: function setParent(item, new_pid, silent) {
    this._setParentInner(item, new_pid, silent);

    item[this.$parentProperty] = new_pid;
  },
  _eachItemCached: function _eachItemCached(code, cache) {
    for (var i = 0, len = cache.length; i < len; i++) {
      code.call(this, cache[i]);
    }
  },
  _eachItemIterate: function _eachItemIterate(code, startId, cache) {
    var itemsStack = this.getChildren(startId);

    if (itemsStack.length) {
      itemsStack = itemsStack.slice().reverse();
    }

    while (itemsStack.length) {
      var itemId = itemsStack.pop();
      var item = this.getItem(itemId);
      code.call(this, item);

      if (cache) {
        cache.push(item);
      }

      if (this.hasChild(item.id)) {
        var children = this.getChildren(item.id);
        var len = children.length;

        for (var i = len - 1; i >= 0; i--) {
          itemsStack.push(children[i]);
        }
      }
    }
  },
  eachItem: function eachItem(code, parent) {
    var rootId = this.$getRootId();

    if (!utils.defined(parent)) {
      parent = rootId;
    }

    var startId = replaceValidZeroId(parent, rootId) || rootId;
    var useCache = false;
    var buildCache = false;
    var cache = null;

    if (startId === rootId) {
      if (this._eachItemMainRangeCache) {
        useCache = true;
        cache = this._eachItemMainRangeCache;
      } else {
        buildCache = true;
        cache = this._eachItemMainRangeCache = [];
      }
    }

    if (useCache) {
      this._eachItemCached(code, cache);
    } else {
      this._eachItemIterate(code, startId, buildCache ? cache : null);
    }
  },
  eachParent: function eachParent(code, startItem) {
    var parentsHash = {};
    var item = startItem;
    var parent = this.getParent(item);

    while (this.exists(parent)) {
      if (parentsHash[parent]) {
        throw new Error("Invalid tasks tree. Cyclic reference has been detected on task " + parent);
      }

      parentsHash[parent] = true;
      item = this.getItem(parent);
      code.call(this, item);
      parent = this.getParent(item);
    }
  },
  _add_branch: function _add_branch(item, index, parent) {
    var pid = parent === undefined ? this.getParent(item) : parent;
    if (!this.hasChild(pid)) this._branches[pid] = powerArray.$create();
    var branch = this.getChildren(pid);
    var added_already = branch.indexOf(item.id + "") > -1 || branch.indexOf(+item.id) > -1;

    if (!added_already) {
      if (index * 1 == index) {
        branch.splice(index, 0, item.id);
      } else {
        branch.push(item.id);
      }

      item.$rendered_parent = pid;
    }
  },
  _move_branch: function _move_branch(item, old_parent, new_parent) {
    this._eachItemMainRangeCache = null; //this.setParent(item, new_parent);
    //this._sync_parent(task);

    this._replace_branch_child(old_parent, item.id);

    if (this.exists(new_parent) || new_parent == this.$getRootId()) {
      this._add_branch(item, undefined, new_parent);
    } else {
      delete this._branches[item.id];
    }

    item.$level = this.calculateItemLevel(item);
    this.eachItem(function (child) {
      child.$level = this.calculateItemLevel(child);
    }, item.id);
  },
  _replace_branch_child: function _replace_branch_child(node, old_id, new_id) {
    var branch = this.getChildren(node);

    if (branch && node !== undefined) {
      var newbranch = powerArray.$create();
      var index = branch.indexOf(old_id + "");

      if (index == -1 && !isNaN(+old_id)) {
        index = branch.indexOf(+old_id);
      }

      if (index > -1) {
        if (new_id) {
          branch.splice(index, 1, new_id);
        } else {
          branch.splice(index, 1);
        }
      }

      newbranch = branch;
      this._branches[node] = newbranch;
    }
  },
  sort: function sort(field, desc, parent) {
    if (!this.exists(parent)) {
      parent = this.$getRootId();
    }

    if (!field) field = "order";
    var criteria = typeof field == "string" ? function (a, b) {
      if (a[field] == b[field] || helpers.isDate(a[field]) && helpers.isDate(b[field]) && a[field].valueOf() == b[field].valueOf()) {
        return 0;
      }

      var result = a[field] > b[field];
      return result ? 1 : -1;
    } : field;

    if (desc) {
      var original_criteria = criteria;

      criteria = function criteria(a, b) {
        return original_criteria(b, a);
      };
    }

    var els = this.getChildren(parent);

    if (els) {
      var temp = [];

      for (var i = els.length - 1; i >= 0; i--) {
        temp[i] = this.getItem(els[i]);
      }

      temp.sort(criteria);

      for (var i = 0; i < temp.length; i++) {
        els[i] = temp[i].id;
        this.sort(field, desc, els[i]);
      }
    }
  },
  filter: function filter(rule) {
    for (var i in this.pull) {
      var renderedParent = this.pull[i].$rendered_parent;
      var actualParent = this.getParent(this.pull[i]);

      if (renderedParent !== actualParent) {
        this._move_branch(this.pull[i], renderedParent, actualParent);
      }
    }

    return DataStore.prototype.filter.apply(this, arguments);
  },
  open: function open(id) {
    if (this.exists(id)) {
      this.getItem(id).$open = true; // GS-2170. Do not recalculate the indexes and dates as they will be recalculated later

      this._skipTaskRecalculation = true;
      this.callEvent("onItemOpen", [id]);
    }
  },
  close: function close(id) {
    if (this.exists(id)) {
      this.getItem(id).$open = false; // GS-2170. Do not recalculate the indexes and dates as they will be recalculated later

      this._skipTaskRecalculation = true;
      this.callEvent("onItemClose", [id]);
    }
  },
  destructor: function destructor() {
    DataStore.prototype.destructor.call(this);
    this._branches = null;
    this._indexRangeCache = {};
    this._eachItemMainRangeCache = null;
  }
}, DataStore.prototype);
module.exports = TreeDataStore;