function CalendarDisabledTimeStrategy(gantt, argumentsHelper) {
  this.argumentsHelper = argumentsHelper;
  this.$gantt = gantt;
}

CalendarDisabledTimeStrategy.prototype = {
  getWorkHours: function getWorkHours() {
    return [0, 24];
  },
  setWorkTime: function setWorkTime() {
    return true;
  },
  unsetWorkTime: function unsetWorkTime() {
    return true;
  },
  isWorkTime: function isWorkTime() {
    return true;
  },
  getClosestWorkTime: function getClosestWorkTime(config) {
    var config = this.argumentsHelper.getClosestWorkTimeArguments.apply(this.argumentsHelper, arguments);
    return config.date;
  },
  calculateDuration: function calculateDuration() {
    var config = this.argumentsHelper.getDurationArguments.apply(this.argumentsHelper, arguments);
    var from = config.start_date,
        to = config.end_date,
        unit = config.unit,
        step = config.step;
    return this._calculateDuration(from, to, unit, step);
  },
  _calculateDuration: function _calculateDuration(start, end, unit, step) {
    var dateHelper = this.$gantt.date;
    var fixedUnits = {
      "week": 1000 * 60 * 60 * 24 * 7,
      "day": 1000 * 60 * 60 * 24,
      "hour": 1000 * 60 * 60,
      "minute": 1000 * 60
    };
    var res = 0;

    if (fixedUnits[unit]) {
      res = Math.round((end - start) / (step * fixedUnits[unit]));
    } else {
      var from = new Date(start),
          to = new Date(end);

      while (from.valueOf() < to.valueOf()) {
        res += 1;
        from = dateHelper.add(from, step, unit);
      }

      if (from.valueOf() != end.valueOf()) {
        res += (to - from) / (dateHelper.add(from, step, unit) - from);
      }
    }

    return Math.round(res);
  },
  hasDuration: function hasDuration() {
    var config = this.argumentsHelper.getDurationArguments.apply(this.argumentsHelper, arguments);
    var from = config.start_date,
        to = config.end_date,
        unit = config.unit;

    if (!unit) {
      return false;
    }

    from = new Date(from);
    to = new Date(to);
    return from.valueOf() < to.valueOf();
  },
  hasWorkTime: function hasWorkTime() {
    return true;
  },
  equals: function equals(calendar) {
    if (!(calendar instanceof CalendarDisabledTimeStrategy)) {
      return false;
    }

    return true;
  },
  calculateEndDate: function calculateEndDate() {
    var config = this.argumentsHelper.calculateEndDateArguments.apply(this.argumentsHelper, arguments);
    var start = config.start_date,
        duration = config.duration,
        unit = config.unit,
        step = config.step;
    return this.$gantt.date.add(start, step * duration, unit);
  }
};
module.exports = CalendarDisabledTimeStrategy;