module.exports = function (gantt) {
  gantt.isReadonly = function (item) {
    if ((typeof item == "number" || typeof item == "string") && gantt.isTaskExists(item)) {
      item = gantt.getTask(item);
    }

    if (item && item[this.config.editable_property]) {
      return false;
    } else {
      return item && item[this.config.readonly_property] || this.config.readonly;
    }
  };
};