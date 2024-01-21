var utils = require("../../utils/utils");

var helpers = require("../../utils/helpers");

function IsWorkTimeArgument(date, unit, task, id, calendar) {
  this.date = date;
  this.unit = unit;
  this.task = task;
  this.id = id;
  this.calendar = calendar;
  return this;
}

function ClosestWorkTimeArgument(date, dir, unit, task, id, calendar) {
  this.date = date;
  this.dir = dir;
  this.unit = unit;
  this.task = task;
  this.id = id;
  this.calendar = calendar;
  return this;
}

function CalculateEndDateArgument(start_date, duration, unit, step, task, id, calendar) {
  this.start_date = start_date;
  this.duration = duration;
  this.unit = unit;
  this.step = step;
  this.task = task;
  this.id = id;
  this.calendar = calendar;
  return this;
}

function GetDurationArgument(start, end, task, calendar) {
  this.start_date = start;
  this.end_date = end;
  this.task = task;
  this.calendar = calendar;
  this.unit = null;
  this.step = null;
  return this;
}

var calendarArgumentsHelper = function calendarArgumentsHelper(gantt) {
  return {
    getWorkHoursArguments: function getWorkHoursArguments() {
      var config = arguments[0];

      if (helpers.isDate(config)) {
        config = {
          date: config
        };
      } else {
        config = utils.mixin({}, config);
      }

      if (!helpers.isValidDate(config.date)) {
        gantt.assert(false, "Invalid date argument for getWorkHours method");
        throw new Error("Invalid date argument for getWorkHours method");
      }

      return config;
    },
    setWorkTimeArguments: function setWorkTimeArguments() {
      return arguments[0];
    },
    unsetWorkTimeArguments: function unsetWorkTimeArguments() {
      return arguments[0];
    },
    isWorkTimeArguments: function isWorkTimeArguments() {
      var config = arguments[0];

      if (config instanceof IsWorkTimeArgument) {
        return config;
      }

      var processedConfig;

      if (!config.date) {
        //IsWorkTimeArgument(date, unit, task, id, calendar)
        processedConfig = new IsWorkTimeArgument(arguments[0], arguments[1], arguments[2], null, arguments[3]);
      } else {
        processedConfig = new IsWorkTimeArgument(config.date, config.unit, config.task, null, config.calendar);
      }

      processedConfig.unit = processedConfig.unit || gantt.config.duration_unit;

      if (!helpers.isValidDate(processedConfig.date)) {
        gantt.assert(false, "Invalid date argument for isWorkTime method");
        throw new Error("Invalid date argument for isWorkTime method");
      }

      return processedConfig;
    },
    getClosestWorkTimeArguments: function getClosestWorkTimeArguments(arg) {
      var config = arguments[0];
      if (config instanceof ClosestWorkTimeArgument) return config;
      var processedConfig;

      if (helpers.isDate(config)) {
        processedConfig = new ClosestWorkTimeArgument(config);
      } else {
        processedConfig = new ClosestWorkTimeArgument(config.date, config.dir, config.unit, config.task, null, //config.id,
        config.calendar);
      }

      if (config.id) {
        processedConfig.task = config;
      }

      processedConfig.dir = config.dir || 'any';
      processedConfig.unit = config.unit || gantt.config.duration_unit;

      if (!helpers.isValidDate(processedConfig.date)) {
        gantt.assert(false, "Invalid date argument for getClosestWorkTime method");
        throw new Error("Invalid date argument for getClosestWorkTime method");
      }

      return processedConfig;
    },
    _getStartEndConfig: function _getStartEndConfig(param) {
      var argumentType = GetDurationArgument;
      var config;
      if (param instanceof argumentType) return param;

      if (helpers.isDate(param)) {
        config = new argumentType(arguments[0], arguments[1], arguments[2], arguments[3]);
      } else {
        config = new argumentType(param.start_date, param.end_date, param.task);

        if (param.id !== null && param.id !== undefined) {
          config.task = param;
        }
      }

      config.unit = config.unit || gantt.config.duration_unit;
      config.step = config.step || gantt.config.duration_step;
      config.start_date = config.start_date || config.start || config.date;

      if (!helpers.isValidDate(config.start_date)) {
        gantt.assert(false, "Invalid start_date argument for getDuration method");
        throw new Error("Invalid start_date argument for getDuration method");
      }

      if (!helpers.isValidDate(config.end_date)) {
        gantt.assert(false, "Invalid end_date argument for getDuration method");
        throw new Error("Invalid end_date argument for getDuration method");
      }

      return config;
    },
    getDurationArguments: function getDurationArguments(start, end, unit, step) {
      return this._getStartEndConfig.apply(this, arguments);
    },
    hasDurationArguments: function hasDurationArguments(start, end, unit, step) {
      return this._getStartEndConfig.apply(this, arguments);
    },
    calculateEndDateArguments: function calculateEndDateArguments(start, duration, unit, step) {
      var config = arguments[0];
      if (config instanceof CalculateEndDateArgument) return config;
      var processedConfig; //CalculateEndDateArgument(start_date, duration, unit, step, task, id, calendar)

      if (helpers.isDate(config)) {
        processedConfig = new CalculateEndDateArgument(arguments[0], arguments[1], arguments[2], undefined, arguments[3], undefined, arguments[4]);
      } else {
        processedConfig = new CalculateEndDateArgument(config.start_date, config.duration, config.unit, config.step, config.task, null, //config.id,
        config.calendar);
      }

      if (config.id !== null && config.id !== undefined) {
        processedConfig.task = config; // received a task object as an argument
        // ignore 'unit' and 'step' properties in this case, since it's likely a part of data model of a task

        processedConfig.unit = null;
        processedConfig.step = null;
      }

      processedConfig.unit = processedConfig.unit || gantt.config.duration_unit;
      processedConfig.step = processedConfig.step || gantt.config.duration_step;

      if (!helpers.isValidDate(processedConfig.start_date)) {
        gantt.assert(false, "Invalid start_date argument for calculateEndDate method");
        throw new Error("Invalid start_date argument for calculateEndDate method");
      }

      return processedConfig;
    }
  };
};

module.exports = calendarArgumentsHelper;