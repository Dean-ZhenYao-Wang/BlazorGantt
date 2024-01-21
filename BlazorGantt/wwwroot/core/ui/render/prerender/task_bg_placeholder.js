module.exports = function (items, gantt) {
  var placeholderConfig = gantt.config.timeline_placeholder;
  items = items || [];

  if (placeholderConfig && items.filter(function (e) {
    return e.id === 'timeline_placeholder_task';
  }).length === 0) {
    var state = gantt.getState();
    var lastTaskId = null;
    var start_date = state.min_date;
    var end_date = state.max_date;

    if (items.length) {
      lastTaskId = items[items.length - 1].id;
    }

    var placeholderTask = {
      start_date: start_date,
      end_date: end_date,
      row_height: placeholderConfig.height || 0,
      id: "timeline_placeholder_task",
      unscheduled: true,
      lastTaskId: lastTaskId,
      calendar_id: placeholderConfig.calendar || "global",
      $source: [],
      $target: []
    };
    items.push(placeholderTask);
  }
};