var ScaleHelper = require("./ui/timeline/scales");

var PrimaryScaleHelper = require("./ui/timeline/scales");

function resolveConfigRange(unit, gantt) {
  var range = {
    start_date: null,
    end_date: null
  };

  if (gantt.config.start_date && gantt.config.end_date) {
    range.start_date = gantt.date[unit + "_start"](new Date(gantt.config.start_date));
    var end = new Date(gantt.config.end_date);
    var start_interval = gantt.date[unit + "_start"](new Date(end));

    if (+end != +start_interval) {
      end = gantt.date.add(start_interval, 1, unit);
    } else {
      end = start_interval;
    }

    range.end_date = end;
  }

  return range;
}

function _scale_range_unit(gantt) {
  var primaryScale = new PrimaryScaleHelper(gantt).primaryScale();
  var unit = primaryScale.unit;
  var step = primaryScale.step;

  if (gantt.config.scale_offset_minimal) {
    var helper = new ScaleHelper(gantt);
    var scales = [helper.primaryScale()].concat(helper.getSubScales());
    helper.sortScales(scales);
    unit = scales[scales.length - 1].unit;
    step = scales[scales.length - 1].step || 1;
  }

  return {
    unit: unit,
    step: step
  };
}

function _init_tasks_range(gantt) {
  var cfg = _scale_range_unit(gantt);

  var unit = cfg.unit,
      step = cfg.step;
  var range = resolveConfigRange(unit, gantt); // GS-1544: Show correct date range if we have tasks or only projects

  if (!(range.start_date && range.end_date)) {
    var onlyProjectTasks = true;
    var tasks = gantt.getTaskByTime();

    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];

      if (task.type !== gantt.config.types.project) {
        onlyProjectTasks = false;
        break;
      }
    }

    if (tasks.length && onlyProjectTasks) {
      var start_date = tasks[0].start_date;
      var end_date = gantt.date.add(start_date, 1, gantt.config.duration_unit);
      range = {
        start_date: new Date(start_date),
        end_date: new Date(end_date)
      };
    } else {
      range = gantt.getSubtaskDates();
    }

    if (!range.start_date || !range.end_date) {
      range = {
        start_date: new Date(),
        end_date: new Date()
      };
    }

    range.start_date = gantt.date[unit + "_start"](range.start_date);
    range.start_date = gantt.calculateEndDate({
      start_date: gantt.date[unit + "_start"](range.start_date),
      duration: -1,
      unit: unit,
      step: step
    }); //one free column before first task

    range.end_date = gantt.date[unit + "_start"](range.end_date);
    range.end_date = gantt.calculateEndDate({
      start_date: range.end_date,
      duration: 2,
      unit: unit,
      step: step
    }); //one free column after last task
  }

  gantt._min_date = range.start_date;
  gantt._max_date = range.end_date;
}

function _adjust_scales(gantt) {
  if (gantt.config.fit_tasks) {
    var old_min = +gantt._min_date,
        old_max = +gantt._max_date; //this._init_tasks_range();

    if (+gantt._min_date != old_min || +gantt._max_date != old_max) {
      gantt.render();
      gantt.callEvent("onScaleAdjusted", []);
      return true;
    }
  }

  return false;
}

module.exports = function updateTasksRange(gantt) {
  _init_tasks_range(gantt);

  _adjust_scales(gantt);
};