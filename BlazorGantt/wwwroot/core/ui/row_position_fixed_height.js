function createHelper(view) {
  var cachedRowHeight = -1;
  var canUseSimpleCalc = -1;
  return {
    resetCache: function resetCache() {
      cachedRowHeight = -1;
      canUseSimpleCalc = -1;
    },
    _getRowHeight: function _getRowHeight() {
      if (cachedRowHeight === -1) {
        cachedRowHeight = view.$getConfig().row_height;
      }

      return cachedRowHeight;
    },
    _refreshState: function _refreshState() {
      this.resetCache();
      canUseSimpleCalc = true;
      var store = view.$config.rowStore;

      if (!store) {
        return;
      }

      var globalRowHeight = this._getRowHeight();

      for (var i = 0; i < store.fullOrder.length; i++) {
        var item = store.getItem(store.fullOrder[i]); // GS-1491: ignore the task when it is filtered:

        if (!item) {
          continue;
        }

        if (item.row_height && item.row_height !== globalRowHeight) {
          canUseSimpleCalc = false;
          break;
        }
      }
    },
    canUseSimpleCalculation: function canUseSimpleCalculation() {
      if (canUseSimpleCalc === -1) {
        this._refreshState();
      }

      return canUseSimpleCalc;
    },

    /**
     * Get top coordinate by row index (order)
     * @param {number} index
     */
    getRowTop: function getRowTop(index) {
      var store = view.$config.rowStore;

      if (!store) {
        return 0;
      }

      return index * this._getRowHeight();
    },

    /**
     * Get height of the item by item id
     * @param {*} itemId
     */
    getItemHeight: function getItemHeight(itemId) {
      return this._getRowHeight();
    },

    /**
     * Get total height of items
     */
    getTotalHeight: function getTotalHeight() {
      if (view.$config.rowStore) {
        var store = view.$config.rowStore;
        return store.countVisible() * this._getRowHeight();
      } else {
        return 0;
      }
    },

    /**
     * Get item by top position
     * @param {*} top
     */
    getItemIndexByTopPosition: function getItemIndexByTopPosition(top) {
      if (view.$config.rowStore) {
        return Math.floor(top / this._getRowHeight());
      } else {
        return 0;
      }
    }
  };
}

module.exports = createHelper;