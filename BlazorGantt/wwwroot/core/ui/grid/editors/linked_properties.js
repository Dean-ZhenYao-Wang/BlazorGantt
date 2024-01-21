module.exports = function (gantt) {
  return function processTaskDateProperties(item, mapTo, mode) {
    if (mode == "keepDates") {
      keepDatesOnEdit(item, mapTo);
    } else if (mode == "keepDuration") {
      keepDurationOnEdit(item, mapTo);
    } else {
      defaultActionOnEdit(item, mapTo);
    }
  }; // resize task
  // resize task when start/end/duration changes

  function keepDatesOnEdit(item, mapTo) {
    if (mapTo == "duration") {
      item.end_date = gantt.calculateEndDate(item);
    } else if (mapTo == "end_date" || mapTo == "start_date") {
      item.duration = gantt.calculateDuration(item);
    }
  } // move task(before 6.2)
  // move task when start/end dates changes
  // resize task when duration changes


  function keepDurationOnEdit(item, mapTo) {
    if (mapTo == "end_date") {
      item.start_date = decreaseStartDate(item);
    } else if (mapTo == "start_date" || mapTo == "duration") {
      item.end_date = gantt.calculateEndDate(item);
    }
  } // default behavior
  // move task when start date changes
  // resize task when end date/duration changes


  function defaultActionOnEdit(item, mapTo) {
    if (gantt.config.schedule_from_end) {
      if (mapTo == "end_date" || mapTo == "duration") {
        item.start_date = decreaseStartDate(item);
      } else if (mapTo == "start_date") {
        item.duration = gantt.calculateDuration(item);
      }
    } else {
      if (mapTo == "start_date" || mapTo == "duration") {
        item.end_date = gantt.calculateEndDate(item);
      } else if (mapTo == "end_date") {
        item.duration = gantt.calculateDuration(item);
      }
    }
  }

  function decreaseStartDate(item) {
    return gantt.calculateEndDate({
      start_date: item.end_date,
      duration: -item.duration,
      task: item
    });
  }
};