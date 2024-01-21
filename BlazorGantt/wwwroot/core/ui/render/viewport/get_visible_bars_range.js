module.exports = function getVisibleTasksRange(gantt, view, config, datastore, viewport) {
  var buffer = 1;
  var start = view.getItemIndexByTopPosition(viewport.y) || 0;
  var end = view.getItemIndexByTopPosition(viewport.y_end) || datastore.count();
  var indexStart = Math.max(0, start - buffer);
  var indexEnd = Math.min(datastore.count(), end + buffer);
  return {
    start: indexStart,
    end: indexEnd
  };
};