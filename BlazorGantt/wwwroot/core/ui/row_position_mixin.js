var quickPositionHelperFactory = require("./row_position_fixed_height");

function createMixin(view) {
  var getItemTopCache = {};
  var getRowTopCache = {};
  var getItemHeightCache = null;
  var totalHeightCache = -1;
  var getItemHeightCacheState = null;
  var quickPosition = quickPositionHelperFactory(view);
  return {
    _resetTopPositionHeight: function _resetTopPositionHeight() {
      getItemTopCache = {};
      getRowTopCache = {};
      quickPosition.resetCache();
    },
    _resetHeight: function _resetHeight() {
      var store = this.$config.rowStore;
      var newState = this.getCacheStateTotalHeight(store);

      if (!getItemHeightCacheState) {
        getItemHeightCacheState = newState;
      } else if (this.shouldClearHeightCache(getItemHeightCacheState, newState)) {
        getItemHeightCacheState = newState;
        getItemHeightCache = null;
      }

      totalHeightCache = -1;
      quickPosition.resetCache();
    },

    /**
     * Get top coordinate by row index (order)
     * @param {number} index
     */
    getRowTop: function getRowTop(index) {
      if (quickPosition.canUseSimpleCalculation()) {
        return quickPosition.getRowTop(index);
      }

      var store = this.$config.rowStore;

      if (!store) {
        return 0;
      }

      if (getRowTopCache[index] !== undefined) {
        return getRowTopCache[index];
      } else {
        var all = store.getIndexRange();
        var top = 0;
        var result = 0;

        for (var i = 0; i < all.length; i++) {
          getRowTopCache[i] = top;
          top += this.getItemHeight(all[i].id);

          if (i < index) {
            result = top;
          }
        }

        return result;
      }
    },

    /**
     * Get top coordinate by item id
     * @param {*} task_id
     */
    getItemTop: function getItemTop(taskId) {
      if (this.$config.rowStore) {
        if (getItemTopCache[taskId] !== undefined) {
          return getItemTopCache[taskId];
        }

        var store = this.$config.rowStore;
        if (!store) return 0;
        var itemIndex = store.getIndexById(taskId);

        if (itemIndex === -1 && store.getParent && store.exists(taskId)) {
          var parentId = store.getParent(taskId);

          if (store.exists(parentId)) {
            // if task is not found in list - maybe it's parent is a split task and we should use parents index instead
            var parent = store.getItem(parentId);

            if (this.$gantt.isSplitTask(parent)) {
              return this.getItemTop(parentId);
            }
          }
        }

        getItemTopCache[taskId] = this.getRowTop(itemIndex);
        return getItemTopCache[taskId];
      } else {
        return 0;
      }
    },

    /**
     * Get height of the item by item id
     * @param {*} itemId
     */
    getItemHeight: function getItemHeight(itemId) {
      if (quickPosition.canUseSimpleCalculation()) {
        return quickPosition.getItemHeight(itemId);
      }

      if (!getItemHeightCache && this.$config.rowStore) {
        this._fillHeightCache(this.$config.rowStore);
      }

      if (getItemHeightCache[itemId] !== undefined) {
        return getItemHeightCache[itemId];
      }

      var defaultHeight = this.$getConfig().row_height;

      if (this.$config.rowStore) {
        var store = this.$config.rowStore;
        if (!store) return defaultHeight;
        var item = store.getItem(itemId);
        return getItemHeightCache[itemId] = item && item.row_height || defaultHeight;
      } else {
        return defaultHeight;
      }
    },
    _fillHeightCache: function _fillHeightCache(store) {
      if (!store) {
        return;
      }

      getItemHeightCache = {};
      var defaultHeight = this.$getConfig().row_height;
      store.eachItem(function (item) {
        return getItemHeightCache[item.id] = item && item.row_height || defaultHeight;
      });
    },
    getCacheStateTotalHeight: function getCacheStateTotalHeight(store) {
      var globalHeight = this.$getConfig().row_height;
      var itemHeightCache = {};
      var items = [];
      var sumHeight = 0;

      if (store) {
        store.eachItem(function (item) {
          items.push(item);
          itemHeightCache[item.id] = item.row_height;
          sumHeight += item.row_height || globalHeight;
        });
      }

      return {
        globalHeight: globalHeight,
        items: items,
        count: items.length,
        sumHeight: sumHeight
      };
    },
    shouldClearHeightCache: function shouldClearHeightCache(oldState, newState) {
      if (oldState.count != newState.count) {
        return true;
      }

      if (oldState.globalHeight != newState.globalHeight) {
        return true;
      }

      if (oldState.sumHeight != newState.sumHeight) {
        return true;
      }

      for (var i in oldState.items) {
        var newValue = newState.items[i];

        if (newValue !== undefined && newValue != oldState.items[i]) {
          return true;
        }
      }

      return false;
    },

    /**
     * Get total height of items
     */
    getTotalHeight: function getTotalHeight() {
      if (quickPosition.canUseSimpleCalculation()) {
        return quickPosition.getTotalHeight();
      }

      if (totalHeightCache != -1) {
        return totalHeightCache;
      }

      if (this.$config.rowStore) {
        var store = this.$config.rowStore;

        this._fillHeightCache(store);

        var getHeight = this.getItemHeight.bind(this);
        var visibleItems = store.getVisibleItems();
        var totalHeight = 0;
        visibleItems.forEach(function (item) {
          totalHeight += getHeight(item.id);
        });
        totalHeightCache = totalHeight;
        return totalHeight;
      } else {
        return 0;
      }
    },

    /**
     * Get item by top position
     * @param {*} top
     */
    getItemIndexByTopPosition: function getItemIndexByTopPosition(top) {
      if (this.$config.rowStore) {
        if (quickPosition.canUseSimpleCalculation()) {
          return quickPosition.getItemIndexByTopPosition(top);
        }

        var store = this.$config.rowStore;

        for (var i = 0; i < store.countVisible(); i++) {
          var current = this.getRowTop(i);
          var next = this.getRowTop(i + 1);

          if (!next) {
            var taskId = store.getIdByIndex(i);
            next = current + this.getItemHeight(taskId);
          }

          if (top >= current && top < next) {
            return i;
          }
        } // GS-1723: If we iterated all tasks and didn't find the position, the target is below all other tasks


        return store.countVisible() + 2;
      } else {
        return 0;
      }
    }
  };
}

module.exports = createMixin;