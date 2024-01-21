/**
 * Check the over task or draggble task is placeholder task
 */
module.exports = function isPlaceholderTask(id, gantt, store, config) {
  // return false;
  var config = gantt ? gantt.config : config;

  if (config && config.placeholder_task) {
    if (store.exists(id)) {
      var item = store.getItem(id);
      return item.type === config.types.placeholder;
    }
  }

  return false;
};