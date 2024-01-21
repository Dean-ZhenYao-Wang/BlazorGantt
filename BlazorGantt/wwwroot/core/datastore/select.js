function createDataStoreSelectMixin(store) {
  var selectedId = null;
  var deleteItem = store._removeItemInner;

  function _unselect(id) {
    selectedId = null;
    this.callEvent("onAfterUnselect", [id]);
  }

  store._removeItemInner = function (id) {
    if (selectedId == id) {
      _unselect.call(this, id);
    }

    if (selectedId && this.eachItem) {
      this.eachItem(function (subItem) {
        if (subItem.id == selectedId) {
          _unselect.call(this, subItem.id);
        }
      }, id);
    }

    return deleteItem.apply(this, arguments);
  };

  store.attachEvent("onIdChange", function (oldId, newId) {
    if (store.getSelectedId() == oldId) {
      store.silent(function () {
        store.unselect(oldId);
        store.select(newId);
      });
    }
  });
  return {
    select: function select(id) {
      if (id) {
        if (selectedId == id) return selectedId;

        if (!this._skip_refresh) {
          if (!this.callEvent("onBeforeSelect", [id])) {
            return false;
          }
        }

        this.unselect();
        selectedId = id;

        if (!this._skip_refresh) {
          this.refresh(id);
          this.callEvent("onAfterSelect", [id]);
        }
      }

      return selectedId;
    },
    getSelectedId: function getSelectedId() {
      return selectedId;
    },
    isSelected: function isSelected(id) {
      return id == selectedId;
    },
    unselect: function unselect(id) {
      var id = id || selectedId;
      if (!id) return;
      selectedId = null;

      if (!this._skip_refresh) {
        this.refresh(id);

        _unselect.call(this, id);
      }
    }
  };
}

module.exports = createDataStoreSelectMixin;