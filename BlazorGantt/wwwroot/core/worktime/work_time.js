var CalendarManager = require("./calendar_manager"),
    TimeCalculator = require("./time_calculator"),
    worktimeFacadeFactory = require("../facades/worktime_calendars"),
    utils = require("../../utils/utils");

module.exports = function (gantt) {
  var manager = new CalendarManager(gantt),
      timeCalculator = new TimeCalculator(manager);
  var facade = worktimeFacadeFactory.create(manager, timeCalculator);
  utils.mixin(gantt, facade);
};