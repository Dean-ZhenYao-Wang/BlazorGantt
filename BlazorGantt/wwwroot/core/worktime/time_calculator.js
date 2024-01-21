var createArgumentsHelper = require("./calendar_arguments_helper"),
    NoWorkTimeCalendar = require("./strategy/no_work_time");

function TimeCalculator(calendarManager) {
  this.$gantt = calendarManager.$gantt;
  this.argumentsHelper = createArgumentsHelper(this.$gantt);
  this.calendarManager = calendarManager;
  this.$disabledCalendar = new NoWorkTimeCalendar(this.$gantt, this.argumentsHelper);
}

TimeCalculator.prototype = {
  _getCalendar: function _getCalendar(config) {
    var calendar;

    if (!this.$gantt.config.work_time) {
      calendar = this.$disabledCalendar;
    } else {
      var manager = this.calendarManager;

      if (config.task) {
        calendar = manager.getTaskCalendar(config.task);
      } else if (config.id) {
        calendar = manager.getTaskCalendar(config);
      } else if (config.calendar) {
        calendar = config.calendar;
      }

      if (!calendar) {
        calendar = manager.getTaskCalendar();
      }
    }

    return calendar;
  },
  getWorkHours: function getWorkHours(config) {
    config = this.argumentsHelper.getWorkHoursArguments.apply(this.argumentsHelper, arguments);

    var calendar = this._getCalendar(config);

    return calendar.getWorkHours(config.date);
  },
  setWorkTime: function setWorkTime(config, calendar) {
    config = this.argumentsHelper.setWorkTimeArguments.apply(this.argumentsHelper, arguments);
    if (!calendar) calendar = this.calendarManager.getCalendar(); // Global

    return calendar.setWorkTime(config);
  },
  unsetWorkTime: function unsetWorkTime(config, calendar) {
    config = this.argumentsHelper.unsetWorkTimeArguments.apply(this.argumentsHelper, arguments);
    if (!calendar) calendar = this.calendarManager.getCalendar(); // Global

    return calendar.unsetWorkTime(config);
  },
  isWorkTime: function isWorkTime(date, unit, task, calendar) {
    var config = this.argumentsHelper.isWorkTimeArguments.apply(this.argumentsHelper, arguments);
    calendar = this._getCalendar(config);
    return calendar.isWorkTime(config);
  },
  getClosestWorkTime: function getClosestWorkTime(config) {
    config = this.argumentsHelper.getClosestWorkTimeArguments.apply(this.argumentsHelper, arguments);

    var calendar = this._getCalendar(config);

    return calendar.getClosestWorkTime(config);
  },
  calculateDuration: function calculateDuration() {
    // start_date_date, end_date, task
    var config = this.argumentsHelper.getDurationArguments.apply(this.argumentsHelper, arguments);

    var calendar = this._getCalendar(config);

    return calendar.calculateDuration(config);
  },
  hasDuration: function hasDuration() {
    var config = this.argumentsHelper.hasDurationArguments.apply(this.argumentsHelper, arguments);

    var calendar = this._getCalendar(config);

    return calendar.hasDuration(config);
  },
  calculateEndDate: function calculateEndDate(config) {
    // start_date, duration, unit, task
    var config = this.argumentsHelper.calculateEndDateArguments.apply(this.argumentsHelper, arguments);

    var calendar = this._getCalendar(config);

    return calendar.calculateEndDate(config);
  }
};
module.exports = TimeCalculator;