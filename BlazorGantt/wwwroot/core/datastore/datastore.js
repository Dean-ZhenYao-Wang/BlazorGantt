var powerArray = require("./power_array");

var utils = require("../../utils/utils");

var eventable = require("../../utils/eventable");

var isPlaceholderTask = require("../../utils/placeholder_task");

var DataStore = function DataStore(config) {
  this.pull = {};
  this.$initItem = config.initItem;
  this.visibleOrder = powerArray.$create();
  this.fullOrder = powerArray.$create();
  this._skip_refresh = false;
  this._filterRule = null;
  this._searchVisibleOrder = {};
  this._indexRangeCache = {};
  this._getItemsCache = null;
  this.$config = config;
  eventable(this);

  this._attachDataChange(function () {
    this._indexRangeCache = {};
    this._getItemsCache = null;
    return true;
  });

  return this;
};

DataStore.prototype = {
  _attachDataChange: function _attachDataChange(callback) {
    this.attachEvent("onClearAll", callback);
    this.attachEvent("onBeforeParse", callback);
    this.attachEvent("onBeforeUpdate", callback);
    this.attachEvent("onBeforeDelete", callback);
    this.attachEvent("onBeforeAdd", callback);
    this.attachEvent("onParse", callback);
    this.attachEvent("onBeforeFilter", callback);
  },
  _parseInner: function _parseInner(data) {
    var item = null,
        loaded = [];

    for (var i = 0, len = data.length; i < len; i++) {
      item = data[i];

      if (this.$initItem) {
        if (this.$config.copyOnParse()) {
          item = utils.copy(item);
        }

        item = this.$initItem(item);
      }

      if (this.callEvent("onItemLoading", [item])) {
        if (!this.pull.hasOwnProperty(item.id)) {
          this.fullOrder.push(item.id);
        }

        loaded.push(item);
        this.pull[item.id] = item;
      }
    }

    return loaded;
  },
  parse: function parse(data) {
    if (!this.isSilent()) {
      this.callEvent("onBeforeParse", [data]);
    }

    var loaded = this._parseInner(data);

    if (!this.isSilent()) {
      this.refresh();
      this.callEvent("onParse", [loaded]);
    }
  },
  getItem: function getItem(id) {
    return this.pull[id];
  },
  _updateOrder: function _updateOrder(code) {
    code.call(this.visibleOrder);
    code.call(this.fullOrder);
  },
  updateItem: function updateItem(id, item) {
    if (!utils.defined(item)) item = this.getItem(id);

    if (!this.isSilent()) {
      if (this.callEvent("onBeforeUpdate", [item.id, item]) === false) return false;
    } // This is how it worked before updating the properties:
    // this.pull[id]=item;


    utils.mixin(this.pull[id], item, true);

    if (!this.isSilent()) {
      this.callEvent("onAfterUpdate", [item.id, item]);
      this.callEvent("onStoreUpdated", [item.id, item, "update"]);
    }
  },
  _removeItemInner: function _removeItemInner(id) {
    //clear from collections
    //this.visibleOrder.$remove(id);
    this._updateOrder(function () {
      this.$remove(id);
    });

    delete this.pull[id];
  },
  removeItem: function removeItem(id) {
    //utils.assert(this.exists(id), "Not existing ID in remove command"+id);
    var obj = this.getItem(id); //save for later event

    if (!this.isSilent()) {
      if (this.callEvent("onBeforeDelete", [obj.id, obj]) === false) return false;
    }

    this.callEvent("onAfterDeleteConfirmed", [obj.id, obj]);

    this._removeItemInner(id);

    if (!this.isSilent()) {
      this.filter();
      this.callEvent("onAfterDelete", [obj.id, obj]); //repaint signal

      this.callEvent("onStoreUpdated", [obj.id, obj, "delete"]);
    }
  },
  _addItemInner: function _addItemInner(item, index) {
    //in case of treetable order is sent as 3rd parameter
    //var order = index;
    if (this.exists(item.id)) {
      this.silent(function () {
        this.updateItem(item.id, item);
      });
    } else {
      var order = this.visibleOrder; //by default item is added to the end of the list

      var data_size = order.length;
      if (!utils.defined(index) || index < 0) index = data_size; //check to prevent too big indexes

      if (index > data_size) {
        //dhx.log("Warning","DataStore:add","Index of out of bounds");
        index = Math.min(order.length, index);
      }
    } //gantt.assert(!this.exists(id), "Not unique ID");


    this.pull[item.id] = item;

    if (!this.isSilent()) {
      this._updateOrder(function () {
        if (this.$find(item.id) === -1) this.$insertAt(item.id, index);
      });
    }

    this.filter(); //order.$insertAt(item.id,index);
  },
  isVisible: function isVisible(id) {
    return this.visibleOrder.$find(id) > -1;
  },
  getVisibleItems: function getVisibleItems() {
    return this.getIndexRange();
  },
  addItem: function addItem(item, index) {
    if (!utils.defined(item.id)) item.id = utils.uid();

    if (this.$initItem) {
      item = this.$initItem(item);
    }

    if (!this.isSilent()) {
      if (this.callEvent("onBeforeAdd", [item.id, item]) === false) return false;
    }

    this._addItemInner(item, index);

    if (!this.isSilent()) {
      this.callEvent("onAfterAdd", [item.id, item]); //repaint signal

      this.callEvent("onStoreUpdated", [item.id, item, "add"]);
    }

    return item.id;
  },
  _changeIdInner: function _changeIdInner(oldId, newId) {
    if (this.pull[oldId]) this.pull[newId] = this.pull[oldId];
    var visibleOrder = this._searchVisibleOrder[oldId];
    this.pull[newId].id = newId;

    this._updateOrder(function () {
      this[this.$find(oldId)] = newId;
    });

    this._searchVisibleOrder[newId] = visibleOrder;
    delete this._searchVisibleOrder[oldId]; //this.visibleOrder[this.visibleOrder.$find(oldId)]=newId;

    delete this.pull[oldId];
  },
  changeId: function changeId(oldId, newId) {
    this._changeIdInner(oldId, newId);

    this.callEvent("onIdChange", [oldId, newId]);
  },
  exists: function exists(id) {
    return !!this.pull[id];
  },
  _moveInner: function _moveInner(sindex, tindex) {
    var id = this.getIdByIndex(sindex);

    this._updateOrder(function () {
      this.$removeAt(sindex);
      this.$insertAt(id, Math.min(this.length, tindex));
    }); //this.visibleOrder.$removeAt(sindex);	//remove at old position
    //if (sindex<tindex) tindex--;	//correct shift, caused by element removing
    //this.visibleOrder.$insertAt(id,Math.min(this.visibleOrder.length, tindex));	//insert at new position

  },
  move: function move(sindex, tindex) {
    //gantt.assert(sindex>=0 && tindex>=0, "DataStore::move","Incorrect indexes");
    var id = this.getIdByIndex(sindex);
    var obj = this.getItem(id);

    this._moveInner(sindex, tindex);

    if (!this.isSilent()) {
      //repaint signal
      this.callEvent("onStoreUpdated", [obj.id, obj, "move"]);
    }
  },
  clearAll: function clearAll() {
    if (this.$destroyed) {
      return;
    } // GS-956 We need to unselect the resource as its ID is cached


    this.silent(function () {
      this.unselect();
    });
    this.pull = {};
    this.visibleOrder = powerArray.$create();
    this.fullOrder = powerArray.$create();
    if (this.isSilent()) return;
    this.callEvent("onClearAll", []);
    this.refresh();
  },
  silent: function silent(code, master) {
    var alreadySilent = false;

    if (this.isSilent()) {
      alreadySilent = true;
    }

    this._skip_refresh = true;
    code.call(master || this);

    if (!alreadySilent) {
      this._skip_refresh = false;
    }
  },
  isSilent: function isSilent() {
    return !!this._skip_refresh;
  },
  arraysEqual: function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;

    for (var i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }

    return true;
  },
  refresh: function refresh(id, quick) {
    if (this.isSilent()) return;
    var item;

    if (id) {
      item = this.getItem(id);
    }

    var args;

    if (id) {
      args = [id, item, "paint"];
    } else {
      args = [null, null, null];
    }

    if (this.callEvent("onBeforeStoreUpdate", args) === false) {
      return;
    }

    var skipFilter = this._quick_refresh && !this._mark_recompute;
    this._mark_recompute = false;

    if (id) {
      // if item changes visible order (e.g. expand-collapse branch) - do a complete repaint
      if (!quick && !skipFilter) {
        var oldOrder = this.visibleOrder;
        this.filter();

        if (!this.arraysEqual(oldOrder, this.visibleOrder)) {
          id = undefined;
        }
      }
    } else if (!skipFilter) {
      this.filter();
    }

    if (id) {
      args = [id, item, "paint"];
    } else {
      args = [null, null, null];
    }

    this.callEvent("onStoreUpdated", args);
  },
  count: function count() {
    return this.fullOrder.length;
  },
  countVisible: function countVisible() {
    return this.visibleOrder.length;
  },
  sort: function sort(_sort) {},
  serialize: function serialize() {},
  eachItem: function eachItem(code) {
    for (var i = 0; i < this.fullOrder.length; i++) {
      var item = this.getItem(this.fullOrder[i]);
      code.call(this, item);
    }
  },
  find: function find(filter) {
    var result = [];
    this.eachItem(function (item) {
      if (filter(item)) {
        result.push(item);
      }
    });
    return result;
  },
  filter: function filter(rule) {
    if (!this.isSilent()) {
      this.callEvent("onBeforeFilter", []);
    }

    this.callEvent("onPreFilter", []);
    var filteredOrder = powerArray.$create();
    var placeholderIds = [];
    this.eachItem(function (item) {
      if (this.callEvent("onFilterItem", [item.id, item])) {
        if (isPlaceholderTask(item.id, null, this, this._ganttConfig)) {
          placeholderIds.push(item.id);
        } else {
          filteredOrder.push(item.id);
        }
      }
    });

    for (var i = 0; i < placeholderIds.length; i++) {
      filteredOrder.push(placeholderIds[i]);
    }

    this.visibleOrder = filteredOrder;
    this._searchVisibleOrder = {};

    for (var i = 0; i < this.visibleOrder.length; i++) {
      this._searchVisibleOrder[this.visibleOrder[i]] = i;
    }

    if (!this.isSilent()) {
      this.callEvent("onFilter", []);
    }
  },
  getIndexRange: function getIndexRange(from, to) {
    var max = Math.min(to || Infinity, this.countVisible() - 1);
    var min = from || 0;
    var cacheKey = min + '-' + max;

    if (this._indexRangeCache[cacheKey]) {
      return this._indexRangeCache[cacheKey].slice();
    }

    var ret = [];

    for (var i = min; i <= max; i++) {
      ret.push(this.getItem(this.visibleOrder[i]));
    }

    this._indexRangeCache[cacheKey] = ret.slice();
    return ret;
  },
  getItems: function getItems() {
    if (this._getItemsCache) {
      return this._getItemsCache.slice();
    }

    var res = [];

    for (var i in this.pull) {
      res.push(this.pull[i]);
    }

    this._getItemsCache = res.slice();
    return res;
  },
  getIdByIndex: function getIdByIndex(index) {
    return this.visibleOrder[index];
  },
  getIndexById: function getIndexById(id) {
    var res = this._searchVisibleOrder[id];

    if (res === undefined) {
      res = -1;
    }

    return res;
  },
  _getNullIfUndefined: function _getNullIfUndefined(value) {
    if (value === undefined) {
      return null;
    } else {
      return value;
    }
  },
  getFirst: function getFirst() {
    return this._getNullIfUndefined(this.visibleOrder[0]);
  },
  getLast: function getLast() {
    return this._getNullIfUndefined(this.visibleOrder[this.visibleOrder.length - 1]);
  },
  getNext: function getNext(id) {
    return this._getNullIfUndefined(this.visibleOrder[this.getIndexById(id) + 1]);
  },
  getPrev: function getPrev(id) {
    return this._getNullIfUndefined(this.visibleOrder[this.getIndexById(id) - 1]);
  },
  destructor: function destructor() {
    this.callEvent("onDestroy", []);
    this.detachAllEvents();
    this.$destroyed = true;
    this.pull = null;
    this.$initItem = null;
    this.visibleOrder = null;
    this.fullOrder = null;
    this._skip_refresh = null;
    this._filterRule = null;
    this._searchVisibleOrder = null;
    this._indexRangeCache = {};
  }
};
module.exports = DataStore;