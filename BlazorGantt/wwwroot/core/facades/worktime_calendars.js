// TODO: rework public api for date methods
var utils = require("../../utils/utils");

var createWorkTimeFacade = function createWorkTimeFacade(calendarManager, timeCalculator) {
  return {
    getWorkHours: function getWorkHours(date) {
      return timeCalculator.getWorkHours(date);
    },
    setWorkTime: function setWorkTime(config) {
      return timeCalculator.setWorkTime(config);
    },
    unsetWorkTime: function unsetWorkTime(config) {
      timeCalculator.unsetWorkTime(config);
    },
    isWorkTime: function isWorkTime(date, unit, task) {
      return timeCalculator.isWorkTime(date, unit, task);
    },
    getClosestWorkTime: function getClosestWorkTime(config) {
      return timeCalculator.getClosestWorkTime(config);
    },
    calculateDuration: function calculateDuration(start_date, end_date, task) {
      return timeCalculator.calculateDuration(start_date, end_date, task);
    },
    _hasDuration: function _hasDuration(start_date, end_date, task) {
      return timeCalculator.hasDuration(start_date, end_date, task);
    },
    calculateEndDate: function calculateEndDate(start, duration, unit, task) {
      return timeCalculator.calculateEndDate(start, duration, unit, task);
    },
    mergeCalendars: utils.bind(calendarManager.mergeCalendars, calendarManager),
    createCalendar: utils.bind(calendarManager.createCalendar, calendarManager),
    addCalendar: utils.bind(calendarManager.addCalendar, calendarManager),
    getCalendar: utils.bind(calendarManager.getCalendar, calendarManager),
    getCalendars: utils.bind(calendarManager.getCalendars, calendarManager),
    getResourceCalendar: utils.bind(calendarManager.getResourceCalendar, calendarManager),
    getTaskCalendar: utils.bind(calendarManager.getTaskCalendar, calendarManager),
    deleteCalendar: utils.bind(calendarManager.deleteCalendar, calendarManager)
  };
};

module.exports = {
  create: createWorkTimeFacade
};