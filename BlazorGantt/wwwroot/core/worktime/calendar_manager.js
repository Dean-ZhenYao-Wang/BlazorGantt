var utils = require("../../utils/utils");

var createArgumentsHelper = require("./calendar_arguments_helper");

var CalendarMergeHelper = require("./strategy/work_calendar_merger");

var CalendarWorkTimeStrategy = require("./strategy/calendar_strategy");

var legacyResourceCalendarConfig = require("./legacy_resource_config");

var dynamicResourceCalendars = require("./dynamic_resource_calendars")();

function CalendarManager(gantt) {
  this.$gantt = gantt;
  this._calendars = {};
  this._legacyConfig = undefined;
  this.$gantt.attachEvent("onGanttReady", function () {
    if (this.$gantt.config.resource_calendars) {
      this._isLegacyConfig = legacyResourceCalendarConfig.isLegacyResourceCalendarFormat(this.$gantt.config.resource_calendars);
    }
  }.bind(this));
  this.$gantt.attachEvent("onBeforeGanttReady", function () {
    this.createDefaultCalendars();
  }.bind(this));
  this.$gantt.attachEvent("onBeforeGanttRender", function () {
    this.createDefaultCalendars();
  }.bind(this));
}

CalendarManager.prototype = {
  _calendars: {},
  _convertWorkTimeSettings: function _convertWorkTimeSettings(settings) {
    var days = settings.days;

    if (days && !settings.dates) {
      settings.dates = settings.dates || {};

      for (var i = 0; i < days.length; i++) {
        settings.dates[i] = days[i];

        if (!(days[i] instanceof Array)) {
          settings.dates[i] = !!days[i];
        }
      }
    }

    delete settings.days;
    return settings;
  },
  mergeCalendars: function mergeCalendars() {
    var calendars = [];
    var args = arguments;

    if (Array.isArray(args[0])) {
      calendars = args[0].slice();
    } else {
      for (var i = 0; i < arguments.length; i++) {
        calendars.push(arguments[i]);
      }
    }

    var mergeHelper = new CalendarMergeHelper();
    var result;
    calendars.forEach(function (calendar) {
      if (!result) {
        result = calendar;
      } else {
        result = this._createCalendarFromConfig(mergeHelper.merge(result, calendar));
      }
    }.bind(this));
    return this.createCalendar(result);
  },
  _createCalendarFromConfig: function _createCalendarFromConfig(config) {
    var apiCore = new CalendarWorkTimeStrategy(this.$gantt, createArgumentsHelper(this.$gantt));
    apiCore.id = String(utils.uid());

    var preparedConfig = this._convertWorkTimeSettings(config);

    if (preparedConfig.customWeeks) {
      for (var i in preparedConfig.customWeeks) {
        preparedConfig.customWeeks[i] = this._convertWorkTimeSettings(preparedConfig.customWeeks[i]);
      }
    }

    apiCore._setConfig(preparedConfig);

    return apiCore;
  },
  createCalendar: function createCalendar(parentCalendar) {
    var settings;

    if (!parentCalendar) {
      parentCalendar = {};
    }

    if (parentCalendar.getConfig) {
      settings = utils.copy(parentCalendar.getConfig());
    } else if (parentCalendar.worktime) {
      settings = utils.copy(parentCalendar.worktime);
    } else {
      settings = utils.copy(parentCalendar);
    }

    var defaults = utils.copy(this.defaults.fulltime.worktime);
    utils.mixin(settings, defaults);
    return this._createCalendarFromConfig(settings);
  },
  getCalendar: function getCalendar(id) {
    id = id || "global";
    var calendar = this._calendars[id];

    if (!calendar) {
      this.createDefaultCalendars();
      calendar = this._calendars[id];
    }

    return calendar;
  },
  getCalendars: function getCalendars() {
    var res = [];

    for (var i in this._calendars) {
      res.push(this.getCalendar(i));
    }

    return res;
  },
  _getOwnCalendar: function _getOwnCalendar(task) {
    var config = this.$gantt.config;

    if (task[config.calendar_property]) {
      return this.getCalendar(task[config.calendar_property]);
    }

    if (config.resource_calendars) {
      var calendar;
      var calendarId;
      var resourceProperty;

      if (this._legacyConfig === false) {
        resourceProperty = config.resource_property;
      } else {
        resourceProperty = legacyResourceCalendarConfig.getResourceProperty(config);
      }

      if (Array.isArray(task[resourceProperty])) {
        // if multiple resources are attached to the task - merge their calendars
        if (config.dynamic_resource_calendars) {
          calendarId = dynamicResourceCalendars.getCalendarIdFromMultipleResources(task[resourceProperty], this);
        }
      } else {
        if (this._legacyConfig === undefined) {
          this._legacyConfig = legacyResourceCalendarConfig.isLegacyResourceCalendarFormat(config.resource_calendars);
        }

        if (this._legacyConfig) {
          var calendarId = legacyResourceCalendarConfig.getCalendarIdFromLegacyConfig(task, config.resource_calendars);
        } else if (resourceProperty && task[resourceProperty] && config.resource_calendars[task[resourceProperty]]) {
          var calendar = this.getResourceCalendar(task[resourceProperty]);
        }
      }

      if (calendarId) {
        calendar = this.getCalendar(calendarId);
      }

      if (calendar) {
        return calendar;
      }
    }

    return null;
  },

  /**
   * Returns calendar assigned to the specified resource.
   * Returns the global calendar if no custom calendar is associated with the resource.
   * @param {(string|number|Object)} resource - resource object or resource id
   * @returns {object} Calendar object
   */
  getResourceCalendar: function getResourceCalendar(resource) {
    if (resource === null || resource === undefined) {
      return this.getCalendar();
    }

    var resourceId = null; // if task id is provided

    if (typeof resource === "number" || typeof resource === "string") {
      resourceId = resource;
    } else {
      resourceId = resource.id || resource.key;
    }

    var config = this.$gantt.config;
    var calendarsConfig = config.resource_calendars;
    var calendarId = null;

    if (calendarsConfig) {
      if (this._legacyConfig === undefined) {
        this._legacyConfig = legacyResourceCalendarConfig.isLegacyResourceCalendarFormat(config.resource_calendars);
      }

      if (this._legacyConfig) {
        for (var field in calendarsConfig) {
          if (calendarsConfig[field][resourceId]) {
            calendarId = calendarsConfig[field][resourceId];
            break;
          }
        }
      } else {
        var calendarId = calendarsConfig[resourceId];
      }

      if (calendarId) {
        return this.getCalendar(calendarId);
      }
    }

    return this.getCalendar();
  },

  /**
   * Returns the calendar assigned to a task.
   * - Returns a calendar assigned via task[gantt.config.calendar_property] if specified.
   * - Returns a calendar assigned to the task resource if specified.
   * - Returns the global calendar otherwise.
   * @param {(string|number|Object)} task - task object or task id
   * @returns {object} Calendar object
   */
  getTaskCalendar: function getTaskCalendar(task) {
    var gantt = this.$gantt;
    var taskObject;

    if (task === null || task === undefined) {
      return this.getCalendar();
    } // if task id is provided


    if ((typeof task === "number" || typeof task === "string") && gantt.isTaskExists(task)) {
      taskObject = gantt.getTask(task);
    } else {
      taskObject = task;
    }

    if (!taskObject) {
      return this.getCalendar();
    }

    var calendar = this._getOwnCalendar(taskObject);

    var groupMode = !!gantt.getState().group_mode;

    if (!calendar && gantt.config.inherit_calendar && gantt.isTaskExists(taskObject.parent)) {
      // GS-1579  group mode overrides tree hierarchy, iterate using `.parent` property, instead of using eachParent iterator
      var currentTask = taskObject;

      while (gantt.isTaskExists(currentTask.parent)) {
        currentTask = gantt.getTask(currentTask.parent);

        if (gantt.isSummaryTask(currentTask)) {
          calendar = this._getOwnCalendar(currentTask);

          if (calendar) {
            break;
          }
        }
      }

      if (groupMode && !calendar) {
        // if group mode and inherit_calendars is enabled - preserve previously applied parent calendar
        // we may need it when groupBy parses grouped data, old parent may be not loaded yet
        if (task.$effective_calendar) {
          calendar = this.getCalendar(task.$effective_calendar);
        }
      }
    }

    return calendar || this.getCalendar();
  },
  addCalendar: function addCalendar(calendar) {
    // puts new calendar to Global Storage - gantt.calendarManager._calendars {}
    if (!this.isCalendar(calendar)) {
      var id = calendar.id;
      calendar = this.createCalendar(calendar);
      calendar.id = id;
    } // validate/check if empty calendar


    if (!calendar._tryChangeCalendarSettings(function () {})) {
      this.$gantt.callEvent("onCalendarError", [{
        message: "Invalid calendar settings, no worktime available"
      }, calendar]);
      return null;
    } else {
      var config = this.$gantt.config;
      calendar.id = calendar.id || utils.uid();
      this._calendars[calendar.id] = calendar;
      if (!config.worktimes) config.worktimes = {};
      config.worktimes[calendar.id] = calendar.getConfig();
      return calendar.id;
    }
  },
  deleteCalendar: function deleteCalendar(calendar) {
    var config = this.$gantt.config;
    if (!calendar) return false;

    if (this._calendars[calendar]) {
      delete this._calendars[calendar];
      if (config.worktimes && config.worktimes[calendar]) delete config.worktimes[calendar];
      return true;
    } else {
      return false;
    }
  },
  restoreConfigCalendars: function restoreConfigCalendars(configs) {
    for (var i in configs) {
      if (this._calendars[i]) continue;
      var settings = configs[i];
      var calendar = this.createCalendar(settings);
      calendar.id = i;
      this.addCalendar(calendar);
    }
  },
  defaults: {
    global: {
      id: "global",
      worktime: {
        hours: [8, 12, 13, 17],
        days: [0, 1, 1, 1, 1, 1, 0]
      }
    },
    fulltime: {
      id: "fulltime",
      worktime: {
        hours: [0, 24],
        days: [1, 1, 1, 1, 1, 1, 1]
      }
    }
  },
  createDefaultCalendars: function createDefaultCalendars() {
    var config = this.$gantt.config;
    this.restoreConfigCalendars(this.defaults);
    this.restoreConfigCalendars(config.worktimes);
  },
  isCalendar: function isCalendar(possibleCalendar) {
    // because we don't have any way to check without dependency to CalendarWorkTimeStrategy
    var props = [possibleCalendar.isWorkTime, possibleCalendar.setWorkTime, possibleCalendar.getWorkHours, possibleCalendar.unsetWorkTime, possibleCalendar.getClosestWorkTime, possibleCalendar.calculateDuration, possibleCalendar.hasDuration, possibleCalendar.calculateEndDate];
    return props.every(function (entry) {
      return entry instanceof Function;
    });
  }
};
module.exports = CalendarManager;