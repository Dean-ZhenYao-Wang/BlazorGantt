var helpers = require("../utils/helpers");

module.exports = function createResourceTimelineBuilder(gantt) {
  var resourceTaskCache = {};
  gantt.$data.tasksStore.attachEvent("onStoreUpdated", function () {
    resourceTaskCache = {};
  });

  function getResourceLoad(resource, resourceProperty, scale, timeline) {
    var cacheKey = resource.id + "_" + resourceProperty + "_" + scale.unit + "_" + scale.step;
    var res;

    if (!resourceTaskCache[cacheKey]) {
      res = resourceTaskCache[cacheKey] = calculateResourceLoad(resource, resourceProperty, scale, timeline);
    } else {
      res = resourceTaskCache[cacheKey];
    }

    return res;
  }

  function calculateResourceLoadFromAssignments(items, scale, assignmentsPassed) {
    var scaleUnit = scale.unit;
    var scaleStep = scale.step;
    var timegrid = {};
    var precalculatedTimes = {};

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var task = item;

      if (assignmentsPassed) {
        task = gantt.getTask(item.task_id);
      }

      var minDate = item.start_date || task.start_date;
      var maxDate = item.end_date || task.end_date;

      if (assignmentsPassed) {
        if (item.start_date) {
          minDate = new Date(Math.max(item.start_date.valueOf(), task.start_date.valueOf()));
        }

        if (item.end_date) {
          maxDate = new Date(Math.min(item.end_date.valueOf(), task.end_date.valueOf()));
        }
      }

      var firstColumn = helpers.findBinary(scale.trace_x, minDate.valueOf());
      var currDate = new Date(scale.trace_x[firstColumn] || gantt.date[scaleUnit + "_start"](new Date(minDate)));
      var calendar = gantt.config.work_time ? gantt.getTaskCalendar(task) : gantt;
      precalculatedTimes[calendar.id] = {};

      while (currDate < maxDate) {
        var cachedTimes = precalculatedTimes[calendar.id];
        var date = currDate;
        var timestamp = date.valueOf();
        currDate = gantt.date.add(currDate, scaleStep, scaleUnit);

        if (cachedTimes[timestamp] === false) {
          continue;
        }

        var isWorkTime = calendar.isWorkTime({
          date: date,
          task: task,
          unit: scaleUnit
        });

        if (!isWorkTime) {
          cachedTimes[timestamp] = false;
          continue;
        }

        if (!timegrid[timestamp]) {
          timegrid[timestamp] = {
            tasks: [],
            assignments: []
          };
        }

        timegrid[timestamp].tasks.push(task);

        if (assignmentsPassed) {
          timegrid[timestamp].assignments.push(item);
        }
      }
    }

    return timegrid;
  }

  function calculateResourceLoad(resource, resourceProperty, scale, timeline) {
    var items;
    var assignmentsPassed = false;
    var timegrid = {};

    if (gantt.config.process_resource_assignments && resourceProperty === gantt.config.resource_property) {
      if (resource.$role == "task") {
        items = gantt.getResourceAssignments(resource.$resource_id, resource.$task_id);
      } else {
        items = gantt.getResourceAssignments(resource.id);
      }

      assignmentsPassed = true;
    } else if (resource.$role == "task") {
      items = [];
    } else {
      items = gantt.getTaskBy(resourceProperty, resource.id);
    }

    var timegrid = calculateResourceLoadFromAssignments(items, scale, assignmentsPassed);
    var scaleUnit = scale.unit;
    var scaleStep = scale.step;
    var timetable = [];
    var start, end, tasks, assignments, cell;
    var config = timeline.$getConfig();

    for (var i = 0; i < scale.trace_x.length; i++) {
      start = new Date(scale.trace_x[i]);
      end = gantt.date.add(start, scaleStep, scaleUnit);
      cell = timegrid[start.valueOf()] || {};
      tasks = cell.tasks || [];
      assignments = cell.assignments || [];

      if (tasks.length || config.resource_render_empty_cells) {
        timetable.push({
          start_date: start,
          end_date: end,
          tasks: tasks,
          assignments: assignments
        });
      } else {
        timetable.push(null);
      }
    }

    return timetable;
  }

  return getResourceLoad;
};