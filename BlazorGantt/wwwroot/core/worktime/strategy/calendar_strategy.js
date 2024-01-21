function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var createCacheObject = require("./work_unit_cache").createCacheObject;

var LargerUnitsCache = require("./work_unit_cache").LargerUnitsCache;

var utils = require("../../../utils/utils");

var DateDurationCache = require("./work_unit_cache/date_duration_cache").DateDurationCache;

function CalendarWorkTimeStrategy(gantt, argumentsHelper) {
  this.argumentsHelper = argumentsHelper;
  this.$gantt = gantt;
  this._workingUnitsCache = createCacheObject();
  this._largeUnitsCache = new LargerUnitsCache(this);
  this._dateDurationCache = new DateDurationCache();
  this._worktime = null;
  this._cached_timestamps = {};
  this._cached_timestamps_count = 0;
}

CalendarWorkTimeStrategy.prototype = {
  units: ["year", "month", "week", "day", "hour", "minute"],
  _clearCaches: function _clearCaches() {
    this._workingUnitsCache.clear();

    this._largeUnitsCache.clear();

    this._dateDurationCache.clear();
  },
  // cache previously calculated worktime
  _getUnitOrder: function _getUnitOrder(unit) {
    for (var i = 0, len = this.units.length; i < len; i++) {
      if (this.units[i] == unit) return i;
    }
  },
  _resetTimestampCache: function _resetTimestampCache() {
    this._cached_timestamps = {};
    this._cached_timestamps_count = 0;
  },
  _timestamp: function _timestamp(settings) {
    // minor optimization, store calculated timestamps to reduce computations
    // reset cache when number of keys exceeds large number where key lookup may became more expensive than the recalculation
    if (this._cached_timestamps_count > 1000000) {
      this._resetTimestampCache();
    }

    var timestamp = null;

    if (settings.day || settings.day === 0) {
      timestamp = settings.day;
    } else if (settings.date) {
      var value = String(settings.date.valueOf());

      if (this._cached_timestamps[value]) {
        timestamp = this._cached_timestamps[value];
      } else {
        // store worktime datestamp in utc so it could be recognized in different timezones (e.g. opened locally and sent to the export service in different timezone)
        timestamp = Date.UTC(settings.date.getFullYear(), settings.date.getMonth(), settings.date.getDate());
        this._cached_timestamps[value] = timestamp;
        this._cached_timestamps_count++;
      }
    }

    return timestamp;
  },
  _checkIfWorkingUnit: function _checkIfWorkingUnit(date, unit) {
    // GS-596: If unit is larger than day or has a custom logic
    if (!this["_is_work_" + unit]) {
      var from = this.$gantt.date["".concat(unit, "_start")](new Date(date));
      var to = this.$gantt.date.add(from, 1, unit);
      return this.hasDuration(from, to);
    }

    return this["_is_work_" + unit](date);
  },
  //checkings for particular time units
  //methods for month-year-week can be defined, otherwise always return 'true'
  _is_work_day: function _is_work_day(date) {
    var val = this._getWorkHours(date);

    if (Array.isArray(val)) {
      return val.length > 0;
    }

    return false;
  },
  _is_work_hour: function _is_work_hour(date) {
    var hours = this._getWorkHours(date); // [{start: 8*60*60, end: 12*60*60}, {start: 13*60*60, end: 17*60*60}]


    var value = date.getHours();

    for (var i = 0; i < hours.length; i++) {
      if (value >= hours[i].startHour && value < hours[i].endHour) {
        return true;
      }
    }

    return false;
  },
  _getTimeOfDayStamp: function _getTimeOfDayStamp(date, dayEnd) {
    var hours = date.getHours();

    if (!date.getHours() && !date.getMinutes() && dayEnd) {
      hours = 24;
    }

    return hours * 60 * 60 + date.getMinutes() * 60;
  },
  _is_work_minute: function _is_work_minute(date) {
    var hours = this._getWorkHours(date); // [{start: 8*60*60, end: 12*60*60}, {start: 13*60*60, end: 17*60*60}]


    var checkTime = this._getTimeOfDayStamp(date);

    for (var i = 0; i < hours.length; i++) {
      if (checkTime >= hours[i].start && checkTime < hours[i].end) {
        return true;
      }
    }

    return false;
  },
  _nextDate: function _nextDate(start, unit, step) {
    return this.$gantt.date.add(start, step, unit);
  },
  _getWorkUnitsBetweenGeneric: function _getWorkUnitsBetweenGeneric(from, to, unit, step) {
    var dateHelper = this.$gantt.date;
    var start = new Date(from),
        end = new Date(to);
    step = step || 1;
    var units = 0;
    var next = null;
    var stepStart, stepEnd; // calculating decimal durations, i.e. 2016-09-20 00:05:00 - 2016-09-20 01:00:00 ~ 0.95 instead of 1
    // and also  2016-09-20 00:00:00 - 2016-09-20 00:05:00 ~ 0.05 instead of 1
    // durations must be rounded later

    var checkFirst = false;
    stepStart = dateHelper[unit + "_start"](new Date(start));

    if (stepStart.valueOf() != start.valueOf()) {
      checkFirst = true;
    }

    var checkLast = false;
    stepEnd = dateHelper[unit + "_start"](new Date(to));

    if (stepEnd.valueOf() != to.valueOf()) {
      checkLast = true;
    }

    var isLastStep = false;

    while (start.valueOf() < end.valueOf()) {
      next = this._nextDate(start, unit, step);
      isLastStep = next.valueOf() > end.valueOf();

      if (this._isWorkTime(start, unit)) {
        if (checkFirst || checkLast && isLastStep) {
          stepStart = dateHelper[unit + "_start"](new Date(start));
          stepEnd = dateHelper.add(stepStart, step, unit);
        }

        if (checkFirst) {
          checkFirst = false;
          next = this._nextDate(stepStart, unit, step);
          units += (stepEnd.valueOf() - start.valueOf()) / (stepEnd.valueOf() - stepStart.valueOf());
        } else if (checkLast && isLastStep) {
          checkLast = false;
          units += (end.valueOf() - start.valueOf()) / (stepEnd.valueOf() - stepStart.valueOf());
        } else {
          units++;
        }
      } else {
        var unitOrder = this._getUnitOrder(unit);

        var biggerTimeUnit = this.units[unitOrder - 1];

        if (biggerTimeUnit && !this._isWorkTime(start, biggerTimeUnit)) {
          next = this._getClosestWorkTimeFuture(start, biggerTimeUnit);
        }
      }

      start = next;
    }

    return units;
  },
  _getMinutesPerHour: function _getMinutesPerHour(date) {
    var hourStart = this._getTimeOfDayStamp(date);

    var hourEnd = this._getTimeOfDayStamp(this._nextDate(date, "hour", 1));

    if (hourEnd === 0) {
      hourEnd = 24 * 60 * 60;
    }

    var worktimes = this._getWorkHours(date);

    for (var i = 0; i < worktimes.length; i++) {
      var interval = worktimes[i];

      if (hourStart >= interval.start && hourEnd <= interval.end) {
        return 60; // hour inside a working interval, all hour is a work hour
      } else if (hourStart < interval.end && hourEnd > interval.start) {
        // hour is partially work time
        var duration = Math.min(hourEnd, interval.end) - Math.max(hourStart, interval.start);
        return duration / 60;
      }
    }

    return 0;
  },
  _getMinutesPerDay: function _getMinutesPerDay(date) {
    var hours = this._getWorkHours(date);

    var res = 0;
    hours.forEach(function (interval) {
      res += interval.durationMinutes;
    });
    return res;
  },
  getHoursPerDay: function getHoursPerDay(date) {
    var hours = this._getWorkHours(date);

    var res = 0;
    hours.forEach(function (interval) {
      res += interval.durationHours;
    });
    return res;
  },
  _getWorkUnitsForRange: function _getWorkUnitsForRange(from, to, unit, step) {
    var total = 0;
    var start = new Date(from),
        end = new Date(to);
    var getUnitsPerDay;

    if (unit == "minute") {
      getUnitsPerDay = utils.bind(this._getMinutesPerDay, this);
    } else {
      getUnitsPerDay = utils.bind(this.getHoursPerDay, this);
    }

    while (start.valueOf() < end.valueOf()) {
      if (end - start > 1000 * 60 * 60 * 24 * 32 && start.getDate() === 0) {
        var units = this._largeUnitsCache.getMinutesPerMonth(start);

        if (unit == "hour") {
          units = units / 60;
        }

        total += units;
        start = this.$gantt.date.add(start, 1, "month");
        continue;
      } else if (end - start > 1000 * 60 * 60 * 24 * 16) {
        var weekStart = this.$gantt.date.week_start(new Date(start));

        if (start.valueOf() === weekStart.valueOf()) {
          var units = this._largeUnitsCache.getMinutesPerWeek(start);

          if (unit == "hour") {
            units = units / 60;
          }

          total += units;
          start = this.$gantt.date.add(start, 7, "day");
          continue;
        }
      } //	if (this._isWorkTime(start, "day")) {


      total += getUnitsPerDay(start); //	}

      start = this._nextDate(start, "day", 1);
    }

    return total / step;
  },
  _getMinutesBetweenSingleDay: function _getMinutesBetweenSingleDay(from, to) {
    var range = this._getIntervalTimestamp(from, to);

    var worktimes = this._getWorkHours(from);

    var result = 0;

    for (var i = 0; i < worktimes.length; i++) {
      var interval = worktimes[i];

      if (range.end >= interval.start && range.start <= interval.end) {
        var minuteFrom = Math.max(interval.start, range.start);
        var minuteTo = Math.min(interval.end, range.end);
        result += (minuteTo - minuteFrom) / 60;
        range.start = minuteTo;
      }
    }

    return Math.floor(result);
  },
  _getMinutesBetween: function _getMinutesBetween(from, to, unit, step) {
    var start = new Date(from),
        end = new Date(to);
    step = step || 1;
    var firstDayStart = new Date(start);
    var firstDayEnd = this.$gantt.date.add(this.$gantt.date.day_start(new Date(start)), 1, "day");

    if (end.valueOf() <= firstDayEnd.valueOf()) {
      return this._getMinutesBetweenSingleDay(from, to);
    } else {
      var lastDayStart = this.$gantt.date.day_start(new Date(end));
      var lastDayEnd = end;

      var startPart = this._getMinutesBetweenSingleDay(firstDayStart, firstDayEnd);

      var endPart = this._getMinutesBetweenSingleDay(lastDayStart, lastDayEnd);

      var rangePart = this._getWorkUnitsForRange(firstDayEnd, lastDayStart, unit, step);

      var total = startPart + rangePart + endPart;
      return total;
    }
  },
  // optimized method for calculating work units duration of large time spans
  // implemented for hours and minutes units, bigger time units don't benefit from the optimization so much
  _getHoursBetween: function _getHoursBetween(from, to, unit, step) {
    var start = new Date(from),
        end = new Date(to);
    step = step || 1;
    var firstDayStart = new Date(start);
    var firstDayEnd = this.$gantt.date.add(this.$gantt.date.day_start(new Date(start)), 1, "day");

    if (end.valueOf() <= firstDayEnd.valueOf()) {
      return Math.round(this._getMinutesBetweenSingleDay(from, to) / 60);
    } else {
      var lastDayStart = this.$gantt.date.day_start(new Date(end));
      var lastDayEnd = end;
      var startPart = this._getMinutesBetweenSingleDay(firstDayStart, firstDayEnd, unit, step) / 60;
      var endPart = this._getMinutesBetweenSingleDay(lastDayStart, lastDayEnd, unit, step) / 60;

      var rangePart = this._getWorkUnitsForRange(firstDayEnd, lastDayStart, unit, step);

      var total = startPart + rangePart + endPart;
      return Math.round(total);
    }
  },
  getConfig: function getConfig() {
    return this._worktime;
  },
  _setConfig: function _setConfig(settings) {
    this._worktime = settings;

    this._parseSettings();

    this._clearCaches();
  },
  _parseSettings: function _parseSettings() {
    var settings = this.getConfig();
    settings.parsed = {
      dates: {},
      hours: null,
      haveCustomWeeks: false,
      customWeeks: {},
      customWeeksRangeStart: null,
      customWeeksRangeEnd: null,
      customWeeksBoundaries: []
    };
    settings.parsed.hours = this._parseHours(settings.hours);

    for (var i in settings.dates) {
      settings.parsed.dates[i] = this._parseHours(settings.dates[i]);
    }

    if (settings.customWeeks) {
      var minCustomRangeStart = null;
      var maxCustomRangeEnd = null;

      for (var i in settings.customWeeks) {
        var customTime = settings.customWeeks[i];

        if (customTime.from && customTime.to) {
          var rangeStart = customTime.from;
          var rangeEnd = customTime.to;

          if (!minCustomRangeStart || minCustomRangeStart > rangeStart.valueOf()) {
            minCustomRangeStart = rangeStart.valueOf();
          }

          if (!maxCustomRangeEnd || maxCustomRangeEnd < rangeEnd.valueOf()) {
            maxCustomRangeEnd = rangeEnd.valueOf();
          }

          settings.parsed.customWeeksBoundaries.push({
            from: rangeStart.valueOf(),
            fromReadable: new Date(rangeStart),
            to: rangeEnd.valueOf(),
            toReadable: new Date(rangeEnd),
            name: i
          });
          settings.parsed.haveCustomWeeks = true;
          var currentWeek = settings.parsed.customWeeks[i] = {
            from: customTime.from,
            to: customTime.to,
            hours: this._parseHours(customTime.hours),
            dates: {}
          };

          for (var d in customTime.dates) {
            currentWeek.dates[d] = this._parseHours(customTime.dates[d]);
          }
        }
      }

      settings.parsed.customWeeksRangeStart = minCustomRangeStart;
      settings.parsed.customWeeksRangeEnd = maxCustomRangeEnd;
    }
  },
  _tryChangeCalendarSettings: function _tryChangeCalendarSettings(payload) {
    var backup = JSON.stringify(this.getConfig());
    payload();

    if (!this.hasWorkTime()) {
      //	this.$gantt.assert(false, "Invalid calendar settings, no worktime available");
      this._setConfig(JSON.parse(backup));

      this._clearCaches();

      return false;
    }

    return true;
  },
  _arraysEqual: function _arraysEqual(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length != b.length) return false;

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }

    return true;
  },
  _compareSettings: function _compareSettings(mySettings, thatSettings) {
    if (!this._arraysEqual(mySettings.hours, thatSettings.hours)) {
      return false;
    }

    var myDays = Object.keys(mySettings.dates);
    var otherDates = Object.keys(thatSettings.dates);
    myDays.sort();
    otherDates.sort();

    if (!this._arraysEqual(myDays, otherDates)) {
      return false;
    }

    for (var i = 0; i < myDays.length; i++) {
      var timestamp = myDays[i];
      var myHours = mySettings.dates[timestamp];
      var otherHours = mySettings.dates[timestamp]; // day settings not equal

      if (myHours !== otherHours && // but still can be two arrays with the equivalent hour settings
      !(Array.isArray(myHours) && Array.isArray(otherHours) && this._arraysEqual(myHours, otherHours))) {
        return false;
      }
    }

    return true;
  },
  equals: function equals(calendar) {
    if (!(calendar instanceof CalendarWorkTimeStrategy)) {
      return false;
    }

    var mySettings = this.getConfig();
    var thatSettings = calendar.getConfig();

    if (!this._compareSettings(mySettings, thatSettings)) {
      return false;
    }

    if (mySettings.parsed.haveCustomWeeks && thatSettings.parsed.haveCustomWeeks) {
      if (mySettings.parsed.customWeeksBoundaries.length != thatSettings.parsed.customWeeksBoundaries.length) {
        return false;
      }

      for (var i in mySettings.parsed.customWeeks) {
        var myWeek = mySettings.parsed.customWeeks[i];
        var thatWeek = thatSettings.parsed.customWeeks[i];

        if (!thatWeek) {
          return false;
        }

        if (!this._compareSettings(myWeek, thatWeek)) {
          return false;
        }
      }
    } else if (mySettings.parse.haveCustomWeeks !== thatSettings.parsed.haveCustomWeeks) {
      return false;
    }

    return true;
  },
  getWorkHours: function getWorkHours() {
    var config = this.argumentsHelper.getWorkHoursArguments.apply(this.argumentsHelper, arguments);
    return this._getWorkHours(config.date, false);
  },
  _getWorkHours: function _getWorkHours(date, parsed) {
    var calendar = this.getConfig();

    if (parsed !== false) {
      calendar = calendar.parsed;
    }

    if (!date) {
      return calendar.hours;
    }

    var dateValue = this._timestamp({
      date: date
    });

    if (calendar.haveCustomWeeks) {
      if (calendar.customWeeksRangeStart <= dateValue && calendar.customWeeksRangeEnd > dateValue) {
        for (var i = 0; i < calendar.customWeeksBoundaries.length; i++) {
          if (calendar.customWeeksBoundaries[i].from <= dateValue && calendar.customWeeksBoundaries[i].to > dateValue) {
            calendar = calendar.customWeeks[calendar.customWeeksBoundaries[i].name];
            break;
          }
        }
      }
    }

    var hours = true;

    if (calendar.dates[dateValue] !== undefined) {
      hours = calendar.dates[dateValue]; //custom day
    } else if (calendar.dates[date.getDay()] !== undefined) {
      hours = calendar.dates[date.getDay()]; //week day
    }

    if (hours === true) {
      return calendar.hours;
    } else if (hours) {
      return hours;
    }

    return [];
  },
  _getIntervalTimestamp: function _getIntervalTimestamp(from, to) {
    var res = {
      start: 0,
      end: 0
    };
    res.start = from.getHours() * 60 * 60 + from.getMinutes() * 60 + from.getSeconds();
    var endHours = to.getHours();

    if (!endHours && !to.getMinutes() && !to.getSeconds() && from.valueOf() < to.valueOf()) {
      endHours = 24;
    }

    res.end = endHours * 60 * 60 + to.getMinutes() * 60 + to.getSeconds();
    return res;
  },
  _parseHours: function _parseHours(hours) {
    if (Array.isArray(hours)) {
      var timestampRanges = []; // worktime as seconds range

      hours.forEach(function (hour) {
        if (typeof hour === "number") {
          timestampRanges.push(hour * 60 * 60);
        } else if (typeof hour === "string") {
          // "12-13", or "12:00-13:00", or "12:00:00-13:00:00"
          hour.split("-").map(function (time) {
            return time.trim();
          }).forEach(function (part) {
            var parsed = part.split(":").map(function (time) {
              return time.trim();
            });
            var value = parseInt(parsed[0] * 60 * 60);

            if (parsed[1]) {
              value += parseInt(parsed[1] * 60);
            }

            if (parsed[2]) {
              value += parseInt(parsed[2]);
            }

            timestampRanges.push(value);
          });
        }
      });
      var timerangeConfig = [];

      for (var i = 0; i < timestampRanges.length; i += 2) {
        var start = timestampRanges[i];
        var end = timestampRanges[i + 1];
        var duration = end - start;
        timerangeConfig.push({
          start: start,
          end: end,
          startHour: Math.floor(start / (60 * 60)),
          startMinute: Math.floor(start / 60),
          endHour: Math.ceil(end / (60 * 60)),
          endMinute: Math.ceil(end / 60),
          durationSeconds: duration,
          durationMinutes: duration / 60,
          durationHours: duration / (60 * 60)
        });
      }

      return timerangeConfig;
    } else {
      return hours;
    }
  },
  setWorkTime: function setWorkTime(settings) {
    return this._tryChangeCalendarSettings(utils.bind(function () {
      var hours = settings.hours !== undefined ? settings.hours : true;

      var timestamp = this._timestamp(settings);

      var calendarConfig = this.getConfig();

      if (timestamp !== null) {
        calendarConfig.dates[timestamp] = hours;
      } else if (!settings.customWeeks) {
        calendarConfig.hours = hours;
      }

      if (settings.customWeeks) {
        if (!calendarConfig.customWeeks) {
          calendarConfig.customWeeks = {};
        } // GS-1867. allow setWorkTime to exclude dates in the customWeeks range


        if (typeof settings.customWeeks == "string") {
          if (timestamp !== null) {
            calendarConfig.customWeeks[settings.customWeeks].dates[timestamp] = hours;
          } else if (!settings.customWeeks) {
            calendarConfig.customWeeks[settings.customWeeks].hours = hours;
          }
        } else if (_typeof(settings.customWeeks) === "object" && Function.prototype.toString.call(settings.customWeeks.constructor) === "function Object() { [native code] }") {
          for (var i in settings.customWeeks) {
            calendarConfig.customWeeks[i] = settings.customWeeks[i];
          }
        }
      }

      this._parseSettings();

      this._clearCaches();
    }, this));
  },
  unsetWorkTime: function unsetWorkTime(settings) {
    return this._tryChangeCalendarSettings(utils.bind(function () {
      if (!settings) {
        this.reset_calendar();
      } else {
        var timestamp = this._timestamp(settings);

        if (timestamp !== null) {
          delete this.getConfig().dates[timestamp];
        }
      } // Load updated settings and clear work units cache


      this._parseSettings();

      this._clearCaches();
    }, this));
  },
  _isWorkTime: function _isWorkTime(date, unit) {
    // Check if this item has in the cache
    var useCache = true; //unit === "day"; // use cache only for days. In case of hours/minutes cache size grows too large and the overhead exceeds the gains

    var isWorkUnit = -1;
    var dateKey = null;

    if (useCache) {
      // use string keys
      dateKey = String(date.valueOf());
      isWorkUnit = this._workingUnitsCache.getItem(unit, dateKey, date);
    }

    if (isWorkUnit == -1) {
      // calculate if not cached
      isWorkUnit = this._checkIfWorkingUnit(date, unit);

      if (useCache) {
        this._workingUnitsCache.setItem(unit, dateKey, isWorkUnit, date);
      }
    }

    return isWorkUnit;
  },
  isWorkTime: function isWorkTime() {
    var config = this.argumentsHelper.isWorkTimeArguments.apply(this.argumentsHelper, arguments);
    return this._isWorkTime(config.date, config.unit);
  },
  calculateDuration: function calculateDuration() {
    var config = this.argumentsHelper.getDurationArguments.apply(this.argumentsHelper, arguments);

    if (!config.unit) {
      return false;
    } //return this._calculateDuration(config.start_date, config.end_date, config.unit, config.step);


    var self = this;
    return this._dateDurationCache.getDuration(config.start_date, config.end_date, config.unit, config.step, function () {
      return self._calculateDuration(config.start_date, config.end_date, config.unit, config.step);
    });
  },
  _calculateDuration: function _calculateDuration(from, to, unit, step) {
    var res = 0;
    var sign = 1;

    if (from.valueOf() > to.valueOf()) {
      var tmp = to;
      to = from;
      from = tmp;
      sign = -1;
    }

    if (unit == "hour" && step == 1) {
      res = this._getHoursBetween(from, to, unit, step);
    } else if (unit == "minute" && step == 1) {
      // quick calculation for minutes with 1 minute step
      res = this._getMinutesBetween(from, to, unit, step);
    } else {
      res = this._getWorkUnitsBetweenGeneric(from, to, unit, step);
    } // getWorkUnits.. returns decimal durations


    return sign * Math.round(res);
  },
  hasDuration: function hasDuration() {
    var config = this.argumentsHelper.getDurationArguments.apply(this.argumentsHelper, arguments);
    var from = config.start_date,
        to = config.end_date,
        unit = config.unit,
        step = config.step;

    if (!unit) {
      return false;
    }

    var start = new Date(from),
        end = new Date(to);
    step = step || 1;

    while (start.valueOf() < end.valueOf()) {
      if (this._isWorkTime(start, unit)) return true;
      start = this._nextDate(start, unit, step);
    }

    return false;
  },
  calculateEndDate: function calculateEndDate() {
    var config = this.argumentsHelper.calculateEndDateArguments.apply(this.argumentsHelper, arguments);
    var from = config.start_date,
        duration = config.duration,
        unit = config.unit,
        step = config.step;
    if (!unit) return false;
    var mult = config.duration >= 0 ? 1 : -1;
    duration = Math.abs(duration * 1); //	var endDate = this._calculateEndDate(from, duration, unit, step * mult);
    //	return endDate;

    var self = this;
    return this._dateDurationCache.getEndDate(from, duration, unit, step * mult, function () {
      return self._calculateEndDate(from, duration, unit, step * mult);
    });
  },
  _calculateEndDate: function _calculateEndDate(from, duration, unit, step) {
    if (!unit) return false;

    if (step == 1 && unit == "minute") {
      return this._calculateMinuteEndDate(from, duration, step);
    } else if (step == -1 && unit == "minute") {
      return this._subtractMinuteDate(from, duration, step);
    } else if (step == 1 && unit == "hour") {
      return this._calculateHourEndDate(from, duration, step);
    } else {
      var interval = this._addInterval(from, duration, unit, step, null);

      return interval.end;
    }
  },
  _addInterval: function _addInterval(start, duration, unit, step, stopAction) {
    var added = 0;
    var current = start;
    var dstShift = false;

    while (added < duration && !(stopAction && stopAction(current))) {
      var next = this._nextDate(current, unit, step); // GS-1501. Correct hours after DST change


      if (unit == "day") {
        dstShift = dstShift || !current.getHours() && next.getHours();

        if (dstShift) {
          next.setHours(0);

          if (next.getHours()) {// the day when the timezone is changed, try to correct hours next time
          } else {
            dstShift = false;
          }
        }
      }

      var dateValue = new Date(next.valueOf() + 1);

      if (step > 0) {
        dateValue = new Date(next.valueOf() - 1);
      }

      var workTimeCheck = this._isWorkTime(dateValue, unit);

      if (workTimeCheck && !dstShift) {
        added++;
      }

      current = next;
    }

    return {
      end: current,
      start: start,
      added: added
    };
  },
  _addHoursUntilDayEnd: function _addHoursUntilDayEnd(from, duration) {
    var dayEnd = this.$gantt.date.add(this.$gantt.date.day_start(new Date(from)), 1, "day");
    var added = 0;
    var left = duration;

    var range = this._getIntervalTimestamp(from, dayEnd);

    var worktimes = this._getWorkHours(from);

    for (var i = 0; i < worktimes.length && added < duration; i++) {
      var interval = worktimes[i];

      if (range.end >= interval.start && range.start <= interval.end) {
        var minuteFrom = Math.max(interval.start, range.start);
        var minuteTo = Math.min(interval.end, range.end);
        var rangeHours = (minuteTo - minuteFrom) / (60 * 60);

        if (rangeHours > left) {
          rangeHours = left;
          minuteTo = minuteFrom + left * 60 * 60;
        }

        var addHours = Math.round((minuteTo - minuteFrom) / (60 * 60));
        added += addHours;
        left -= addHours;
        range.start = minuteTo;
      }
    }

    var intervalEnd = dayEnd;

    if (added === duration) {
      intervalEnd = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, range.start);
    }

    return {
      added: added,
      end: intervalEnd
    };
  },
  _calculateHourEndDate: function _calculateHourEndDate(from, duration, step) {
    var start = new Date(from),
        added = 0;
    step = step || 1;
    duration = Math.abs(duration * 1);

    var interval = this._addHoursUntilDayEnd(start, duration);

    added = interval.added;
    start = interval.end;
    var durationLeft = duration - added;

    if (durationLeft) {
      var current = start;

      while (added < duration) {
        var next = this._nextDate(current, "day", step); // reset to day start in case DST switch happens in the process


        next.setHours(0);
        next.setMinutes(0);
        next.setSeconds(0);
        var hoursPerDay = 0;

        if (step > 0) {
          hoursPerDay = this.getHoursPerDay(new Date(next.valueOf() - 1));
        } else {
          hoursPerDay = this.getHoursPerDay(new Date(next.valueOf() + 1));
        }

        if (added + hoursPerDay >= duration) {
          break;
        } else {
          added += hoursPerDay;
        }

        current = next;
      }

      start = current;
    }

    if (added < duration) {
      var durationLeft = duration - added;
      interval = this._addHoursUntilDayEnd(start, durationLeft);
      start = interval.end;
    }

    return start;
  },
  _addMinutesUntilHourEnd: function _addMinutesUntilHourEnd(from, duration) {
    if (from.getMinutes() === 0) {
      // already at hour end
      return {
        added: 0,
        end: new Date(from)
      };
    }

    var hourEnd = this.$gantt.date.add(this.$gantt.date.hour_start(new Date(from)), 1, "hour");
    var added = 0;
    var left = duration;

    var range = this._getIntervalTimestamp(from, hourEnd);

    var worktimes = this._getWorkHours(from);

    for (var i = 0; i < worktimes.length && added < duration; i++) {
      var interval = worktimes[i];

      if (range.end >= interval.start && range.start <= interval.end) {
        var minuteFrom = Math.max(interval.start, range.start);
        var minuteTo = Math.min(interval.end, range.end);
        var rangeMinutes = (minuteTo - minuteFrom) / 60;

        if (rangeMinutes > left) {
          rangeMinutes = left;
          minuteTo = minuteFrom + left * 60;
        } // TODO: verify testcase https://dhtmlxsupport.teamwork.com/desk/tickets/9625700/messages

        /*if (rangeMinutes === 0) {
        	rangeMinutes = left;
        	minuteTo = minuteFrom + (left * 60);
        }*/


        var addMinutes = Math.round((minuteTo - minuteFrom) / 60);
        left -= addMinutes;
        added += addMinutes;
        range.start = minuteTo;
      }
    }

    var intervalEnd = hourEnd;

    if (added === duration) {
      intervalEnd = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, range.start);
    }

    return {
      added: added,
      end: intervalEnd
    };
  },
  _subtractMinutesUntilHourStart: function _subtractMinutesUntilHourStart(from, duration) {
    var hourStart = this.$gantt.date.hour_start(new Date(from));
    var added = 0;
    var left = duration;
    var hourStartTimestamp = hourStart.getHours() * 60 * 60 + hourStart.getMinutes() * 60 + hourStart.getSeconds();
    var initialDateTimestamp = from.getHours() * 60 * 60 + from.getMinutes() * 60 + from.getSeconds();

    var worktimes = this._getWorkHours(from);

    for (var i = worktimes.length - 1; i >= 0 && added < duration; i--) {
      var interval = worktimes[i];

      if (initialDateTimestamp > interval.start && hourStartTimestamp <= interval.end) {
        var minuteFrom = Math.min(initialDateTimestamp, interval.end);
        var minuteTo = Math.max(hourStartTimestamp, interval.start); //	var minuteFrom = Math.max(interval.start, currentHour.start);
        //	var minuteTo = Math.min(interval.end, currentHour.end);

        var rangeMinutes = (minuteFrom - minuteTo) / 60;

        if (rangeMinutes > left) {
          rangeMinutes = left;
          minuteTo = minuteFrom - left * 60;
        } // TODO: verify testcase https://dhtmlxsupport.teamwork.com/desk/tickets/9625700/messages

        /*if (rangeMinutes === 0) {
        	rangeMinutes = left;
        	minuteTo = minuteFrom - (left * 60);
        }*/


        var addMinutes = Math.abs(Math.round((minuteFrom - minuteTo) / 60));
        left -= addMinutes;
        added += addMinutes;
        initialDateTimestamp = minuteTo;
      }
    }

    var intervalEnd = hourStart;

    if (added === duration) {
      intervalEnd = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, initialDateTimestamp);
    }

    return {
      added: added,
      end: intervalEnd
    };
  },
  _subtractMinuteDate: function _subtractMinuteDate(from, duration, step) {
    var start = new Date(from),
        added = 0;
    step = step || -1;
    duration = Math.abs(duration * 1);
    duration = Math.round(duration);

    var minutePrecision = this._isMinutePrecision(start);

    var addedInterval = this._subtractMinutesUntilHourStart(start, duration);

    added += addedInterval.added;
    start = addedInterval.end;
    var calculatedDay = 0;
    var daySchedule = [];
    var minutesInDay = 0;

    while (added < duration) {
      var dayStart = this.$gantt.date.day_start(new Date(start));
      var iterateFromDayEnd = false;

      if (start.valueOf() === dayStart.valueOf()) {
        dayStart = this.$gantt.date.add(dayStart, -1, "day");
        iterateFromDayEnd = true;
      } //var dayStartTimestamp = this.$gantt.date.day_start(new Date(start)).valueOf();


      var dayEnd = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), 23, 59, 59, 999).valueOf();

      if (dayEnd !== calculatedDay) {
        daySchedule = this._getWorkHours(dayStart);
        minutesInDay = this._getMinutesPerDay(dayStart);
        calculatedDay = dayEnd;
      }

      var left = duration - added;

      var timestamp = this._getTimeOfDayStamp(start, iterateFromDayEnd);

      if (!daySchedule.length || !minutesInDay) {
        start = this.$gantt.date.add(start, -1, "day");
        continue;
      }

      if (daySchedule[daySchedule.length - 1].end <= timestamp) {
        if (left > minutesInDay) {
          added += minutesInDay;
          start = this.$gantt.date.add(start, -1, "day");
          continue;
        }
      }

      var isWorkHour = false;
      var workInterval = null;
      var prevInterval = null;

      for (var i = daySchedule.length - 1; i >= 0; i--) {
        if (daySchedule[i].start < timestamp - 1 && daySchedule[i].end >= timestamp - 1) {
          isWorkHour = true;
          workInterval = daySchedule[i];
          prevInterval = daySchedule[i - 1];
          break;
        }
      }

      if (isWorkHour) {
        // we're at the end of worktime interval and subtracting more than the duration of the interval
        // -> subtract the duration of the interval and move to the start of the interval (we're moving from end)
        if (timestamp === workInterval.end && left >= workInterval.durationMinutes) {
          added += workInterval.durationMinutes;
          start = this.$gantt.date.add(start, -workInterval.durationMinutes, "minute");
        } // worktime is set in whole hours (no intervals like 9:15-10:00)
        // the amount we need to subtract lies inside the interval
        else if (!minutePrecision && left <= timestamp / 60 - workInterval.startMinute) {
            added += left;
            start = this.$gantt.date.add(start, -left, "minute");
          } else if (minutePrecision) {
            // GS-2129. If the working time is set in minutes, we accumulate the working time in minutes from right to left
            // duration we need to subtract lies completely inside the work interval
            if (left <= timestamp / 60 - workInterval.startMinute) {
              added += left;
              start = this.$gantt.date.add(start, -left, "minute");
            } else {
              // we need to go trough multiple work intervals to subtract needed time
              added += timestamp / 60 - workInterval.startMinute;

              if (prevInterval) {
                start = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, prevInterval.end);
              } else {
                start = this.$gantt.date.day_start(start);
              }
            }
          } else {
            var minutesInHour = this._getMinutesPerHour(start);

            if (minutesInHour <= left) {
              added += minutesInHour;
              start = this._nextDate(start, "hour", step);
            } else {
              addedInterval = this._subtractMinutesUntilHourStart(start, left);
              added += addedInterval.added;
              start = addedInterval.end;
            }
          }
      } else {
        if (start.getHours() === 0 && start.getMinutes() === 0 && start.getSeconds() === 0) {
          var prev = this._getClosestWorkTimePast(start, "hour");

          if (prev.valueOf() === start.valueOf()) {
            var prev = this.$gantt.date.add(start, -1, "day");

            var times = this._getWorkHours(prev);

            if (times.length) {
              var lastInterval = times[times.length - 1];
              prev.setSeconds(lastInterval.durationSeconds);
            }
          }

          start = prev;
        } else {
          start = this._getClosestWorkTimePast(new Date(start - 1), "hour");
        }
      }
    }

    if (added < duration) {
      var durationLeft = duration - added;
      addedInterval = this._subtractMinutesUntilHourStart(start, durationLeft);
      added += addedInterval.added;
      start = addedInterval.end;
    }

    return start;
  },
  _calculateMinuteEndDate: function _calculateMinuteEndDate(from, duration, step) {
    var start = new Date(from),
        added = 0;
    step = step || 1;
    duration = Math.abs(duration * 1);
    duration = Math.round(duration);

    var addedInterval = this._addMinutesUntilHourEnd(start, duration);

    added += addedInterval.added;
    start = addedInterval.end;
    var calculatedDay = 0;
    var daySchedule = [];
    var minutesInDay = 0;

    var minutePrecision = this._isMinutePrecision(start);

    while (added < duration) {
      var dayStart = this.$gantt.date.day_start(new Date(start)).valueOf();

      if (dayStart !== calculatedDay) {
        daySchedule = this._getWorkHours(start);
        minutesInDay = this._getMinutesPerDay(start);
        calculatedDay = dayStart;
      }

      var left = duration - added;

      var timestamp = this._getTimeOfDayStamp(start);

      if (!daySchedule.length || !minutesInDay) {
        start = this.$gantt.date.add(this.$gantt.date.day_start(start), 1, "day");
        continue;
      }

      if (daySchedule[0].start >= timestamp) {
        if (left >= minutesInDay) {
          added += minutesInDay;

          if (left == minutesInDay) {
            start = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, daySchedule[daySchedule.length - 1].end);
            break;
          } else {
            start = this.$gantt.date.add(start, 1, "day");
            start = this.$gantt.date.day_start(start);
          }

          continue;
        }
      }

      var isWorkHour = false;
      var workInterval = null;

      for (var i = 0; i < daySchedule.length; i++) {
        if (daySchedule[i].start <= timestamp && daySchedule[i].end > timestamp) {
          isWorkHour = true;
          workInterval = daySchedule[i];
          break;
        }
      }

      if (isWorkHour) {
        if (timestamp === workInterval.start && left >= workInterval.durationMinutes) {
          added += workInterval.durationMinutes;
          start = this.$gantt.date.add(start, workInterval.durationMinutes, "minute");
        } else if (left <= workInterval.endMinute - timestamp / 60) {
          added += left;
          start = this.$gantt.date.add(start, left, "minute");
        } else {
          var minutesInHour = this._getMinutesPerHour(start);

          if (minutesInHour <= left) {
            added += minutesInHour; // when the working time settings are set in minutes move to the next minutes

            if (minutePrecision) {
              start = this.$gantt.date.add(start, minutesInHour, "minute");
            } else {
              start = this._nextDate(start, "hour", step);
            }
          } else {
            addedInterval = this._addMinutesUntilHourEnd(start, left);
            added += addedInterval.added;
            start = addedInterval.end;
          }
        }
      } else {
        start = this._getClosestWorkTimeFuture(start, "hour");
      }
    }

    if (added < duration) {
      var durationLeft = duration - added;
      addedInterval = this._addMinutesUntilHourEnd(start, durationLeft);
      added += addedInterval.added;
      start = addedInterval.end;
    }

    return start;
  },
  getClosestWorkTime: function getClosestWorkTime() {
    var settings = this.argumentsHelper.getClosestWorkTimeArguments.apply(this.argumentsHelper, arguments);
    return this._getClosestWorkTime(settings.date, settings.unit, settings.dir);
  },
  _getClosestWorkTime: function _getClosestWorkTime(inputDate, unit, direction) {
    var result = new Date(inputDate);

    if (this._isWorkTime(result, unit)) {
      return result;
    }

    result = this.$gantt.date[unit + '_start'](result);

    if (direction == 'any' || !direction) {
      var closestFuture = this._getClosestWorkTimeFuture(result, unit);

      var closestPast = this._getClosestWorkTimePast(result, unit);

      if (Math.abs(closestFuture - inputDate) <= Math.abs(inputDate - closestPast)) {
        result = closestFuture;
      } else {
        result = closestPast;
      }
    } else if (direction == "past") {
      result = this._getClosestWorkTimePast(result, unit);
    } else {
      result = this._getClosestWorkTimeFuture(result, unit);
    }

    return result;
  },
  _getClosestWorkTimeFuture: function _getClosestWorkTimeFuture(date, unit) {
    return this._getClosestWorkTimeGeneric(date, unit, 1);
  },
  _getClosestWorkTimePast: function _getClosestWorkTimePast(date, unit) {
    var result = this._getClosestWorkTimeGeneric(date, unit, -1); // should return the end of the closest work interval


    return this.$gantt.date.add(result, 1, unit);
  },
  _findClosestTimeInDay: function _findClosestTimeInDay(date, direction, worktimes) {
    var start = new Date(date);
    var resultDate = null;
    var fromDayEnd = false;

    if (!this._getWorkHours(start).length) {
      start = this._getClosestWorkTime(start, "day", direction < 0 ? "past" : "future");

      if (direction < 0) {
        start = new Date(start.valueOf() - 1);
        fromDayEnd = true;
      }

      worktimes = this._getWorkHours(start);
    }

    var value = this._getTimeOfDayStamp(start);

    if (fromDayEnd) {
      value = this._getTimeOfDayStamp(new Date(start.valueOf() + 1), fromDayEnd);
    }

    if (direction > 0) {
      for (var i = 0; i < worktimes.length; i++) {
        if (worktimes[i].start >= value) {
          resultDate = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, worktimes[i].start);
          break;
        }
      }
    } else {
      for (var i = worktimes.length - 1; i >= 0; i--) {
        if (worktimes[i].end <= value) {
          resultDate = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, worktimes[i].end);
          break;
        } else if (worktimes[i].end > value && worktimes[i].start <= value) {
          resultDate = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, value);
          break;
        }
      }
    }

    return resultDate;
  },
  _getClosestWorkMinute: function _getClosestWorkMinute(date, unit, direction) {
    var start = new Date(date);

    var worktimes = this._getWorkHours(start);

    var resultDate = this._findClosestTimeInDay(start, direction, worktimes);

    if (!resultDate) {
      start = this.calculateEndDate(start, direction, "day");

      if (direction > 0) {
        start = this.$gantt.date.day_start(start);
      } else {
        start = this.$gantt.date.day_start(start);
        start = this.$gantt.date.add(start, 1, "day");
        start = new Date(start.valueOf() - 1);
      }

      worktimes = this._getWorkHours(start);
      resultDate = this._findClosestTimeInDay(start, direction, worktimes);
    }

    if (direction < 0) {
      // getClosestWorkTimePast adds one time unit to the result date after this
      resultDate = this.$gantt.date.add(resultDate, -1, unit);
    }

    return resultDate;
  },
  _getClosestWorkTimeGeneric: function _getClosestWorkTimeGeneric(date, unit, increment) {
    if (unit === "hour" || unit === "minute") {
      return this._getClosestWorkMinute(date, unit, increment);
    }

    var unitOrder = this._getUnitOrder(unit),
        biggerTimeUnit = this.units[unitOrder - 1];

    var result = date; // be extra sure we won't fall into infinite loop, 3k seems big enough

    var maximumLoop = 3000,
        count = 0;

    while (!this._isWorkTime(result, unit)) {
      if (biggerTimeUnit && !this._isWorkTime(result, biggerTimeUnit)) {
        // if we look for closest work hour and detect a week-end - first find the closest work day,
        // and continue iterations after that
        if (increment > 0) {
          result = this._getClosestWorkTimeFuture(result, biggerTimeUnit);
        } else {
          result = this._getClosestWorkTimePast(result, biggerTimeUnit);
        }

        if (this._isWorkTime(result, unit)) {
          break;
        }
      }

      count++;

      if (count > maximumLoop) {
        this.$gantt.assert(false, "Invalid working time check");
        return false;
      }

      var tzOffset = result.getTimezoneOffset();
      result = this.$gantt.date.add(result, increment, unit);
      result = this.$gantt._correct_dst_change(result, tzOffset, increment, unit);

      if (this.$gantt.date[unit + '_start']) {
        result = this.$gantt.date[unit + '_start'](result);
      }
    }

    return result;
  },

  /**
   * Check whether this calendar has working time. Calendar has working time only if there are regular working days of week
   *
   */
  hasWorkTime: function hasWorkTime() {
    var worktime = this.getConfig();
    var dates = worktime.dates;
    var daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
    var exceptions = [];

    for (var i in worktime.dates) {
      if (Number(i) > 6) {
        exceptions.push(Number(i));
      }
    }

    var hasRegularHours = this._checkWorkHours(worktime.hours);

    var result = false;
    daysOfWeek.forEach(function (day) {
      if (result) {
        return;
      }

      var dayConfig = dates[day];

      if (dayConfig === true) {
        // workday uses global hours
        result = hasRegularHours;
      } else if (Array.isArray(dayConfig)) {
        // workday uses custom hours
        result = this._checkWorkHours(dayConfig);
      }
    }.bind(this));
    return result;
  },
  _checkWorkHours: function _checkWorkHours(hoursArray) {
    if (hoursArray.length === 0) {
      return false;
    }

    var result = false;

    for (var i = 0; i < hoursArray.length; i += 2) {
      if (hoursArray[i] !== hoursArray[i + 1]) {
        result = true;
      }
    }

    return result;
  },
  _isMinutePrecision: function _isMinutePrecision(date) {
    var minutePrecision = false;

    this._getWorkHours(date).forEach(function (interval) {
      if (interval.startMinute % 60 || interval.endMinute % 60) {
        minutePrecision = true;
      }
    });

    return minutePrecision;
  }
};
module.exports = CalendarWorkTimeStrategy;