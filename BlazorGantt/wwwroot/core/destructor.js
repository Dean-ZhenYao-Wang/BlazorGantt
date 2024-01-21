function extend(gantt) {
  gantt.destructor = function () {
    this.clearAll();
    this.callEvent("onDestroy", []);

    if (this.$root) {
      delete this.$root.gantt;
    }

    if (this._eventRemoveAll) {
      this._eventRemoveAll();
    }

    if (this.$layout) {
      this.$layout.destructor();
    }

    if (this.resetLightbox) {
      this.resetLightbox();
    }

    if (this._dp && this._dp.destructor) {
      this._dp.destructor();
    }

    this.$services.destructor(); // detachAllEvents should be called last, because in components may be attached events

    this.detachAllEvents();

    for (var i in this) {
      if (i.indexOf("$") === 0) {
        delete this[i];
      }
    }

    this.$destroyed = true;
  };
}

module.exports = extend;