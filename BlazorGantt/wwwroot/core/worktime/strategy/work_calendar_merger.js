var utils = require("../../../utils/utils");

function WorkTimeCalendarMerger() {}

WorkTimeCalendarMerger.prototype = {
  /**
   * convert hours array items into objects, e.g. [8, 12, 17, 18] -> [{start: 8, end: 12}, {start:17, end:18}]
   * @param {Array} hoursArray
   */
  _getIntervals: function _getIntervals(hoursArray) {
    var result = [];

    for (var i = 0; i < hoursArray.length; i += 2) {
      result.push({
        start: hoursArray[i],
        end: hoursArray[i + 1]
      });
    }

    return result;
  },

  /**
   * Convert ranges config into hours array
   * [{start: 8, end: 12}, {start:17, end:18}] --> [8, 12, 17, 18]
   * @param {*} intervalsArray
   */
  _toHoursArray: function _toHoursArray(intervalsArray) {
    var result = [];

    function toFixed(value) {
      var str = String(value);

      if (str.length < 2) {
        str = "0" + str;
      }

      return str;
    }

    function formatHHMM(secondsValue) {
      var hours = Math.floor(secondsValue / (60 * 60));
      var minutePart = secondsValue - hours * 60 * 60;
      var minutes = Math.floor(minutePart / 60);
      return hours + ":" + toFixed(minutes);
    }

    for (var i = 0; i < intervalsArray.length; i++) {
      result.push(formatHHMM(intervalsArray[i].start) + "-" + formatHHMM(intervalsArray[i].end));
    }

    return result;
  },

  /**
   * Build intersection of hour intervals. e.g.
   * first: [{start: 8, end: 12}, {start:13, end:18}]
   * second: [{start: 10, end: 15}]
   * result: [{start: 10, end: 12}, {start: 13, end: 15}]
   * @param {Array} first
   * @param {Array} second
   */
  _intersectHourRanges: function _intersectHourRanges(first, second) {
    var result = [];
    var baseArray = first.length > second.length ? first : second;
    var overridesArray = first === baseArray ? second : first;
    baseArray = baseArray.slice();
    overridesArray = overridesArray.slice();
    var result = [];

    for (var i = 0; i < baseArray.length; i++) {
      var base = baseArray[i];

      for (var j = 0; j < overridesArray.length; j++) {
        var current = overridesArray[j];

        if (current.start < base.end && current.end > base.start) {
          result.push({
            start: Math.max(base.start, current.start),
            end: Math.min(base.end, current.end)
          });

          if (base.end > current.end) {
            overridesArray.splice(j, 1);
            j--;
            i--;
          }
        }
      }
    }

    return result;
  },

  /**
   * Reduce the number of ranges in config when possible,
   * joins ranges that can be merged
   * parts: [{start: 8, end: 12}, {start:12, end:13}, {start: 15, end: 17}]
   * result: [{start: 8, end: 13}, {start: 15, end: 17}]
   * @param {Array} parts
   */
  _mergeAdjacentIntervals: function _mergeAdjacentIntervals(parts) {
    var result = parts.slice();
    result.sort(function (a, b) {
      return a.start - b.start;
    });
    var base = result[0];

    for (var i = 1; i < result.length; i++) {
      var current = result[i];

      if (current.start <= base.end) {
        if (current.end > base.end) {
          base.end = current.end;
        }

        result.splice(i, 1);
        i--;
      } else {
        base = current;
      }
    }

    return result;
  },
  _mergeHoursConfig: function _mergeHoursConfig(firstHours, secondHours) {
    //var firstIntervals = this._getIntervals(firstHours);
    //var secondIntervals = this._getIntervals(secondHours);
    return this._mergeAdjacentIntervals(this._intersectHourRanges(firstHours, secondHours));
  },
  merge: function merge(first, second) {
    var firstConfig = utils.copy(first.getConfig().parsed);
    var secondConfig = utils.copy(second.getConfig().parsed);
    var mergedSettings = {
      hours: this._toHoursArray(this._mergeHoursConfig(firstConfig.hours, secondConfig.hours)),
      dates: {},
      customWeeks: {}
    };

    for (var i in firstConfig.dates) {
      var firstDate = firstConfig.dates[i];
      var secondDate = secondConfig.dates[i]; // if this key is a working date in both calendars

      if (firstDate && secondDate) {
        // if at least one of working date is set by hours config - build intersection
        if (Array.isArray(firstDate) || Array.isArray(secondDate)) {
          var firstHours = Array.isArray(firstDate) ? firstDate : firstConfig.hours;
          var secondHours = Array.isArray(secondDate) ? secondDate : secondConfig.hours;
          mergedSettings.dates[i] = this._toHoursArray(this._mergeHoursConfig(firstHours, secondHours));
        } else {
          // date will use global hours
          mergedSettings.dates[i] = true;
        }
      } else {
        mergedSettings.dates[i] = false;
      }
    } // transfer and overwrite custom week calendars


    if (firstConfig.customWeeks) {
      for (var i in firstConfig.customWeeks) {
        mergedSettings.customWeeks[i] = firstConfig.customWeeks[i];
      }
    }

    if (secondConfig.customWeeks) {
      for (var i in secondConfig.customWeeks) {
        mergedSettings.customWeeks[i] = secondConfig.customWeeks[i];
      }
    }

    return mergedSettings;
  }
};
module.exports = WorkTimeCalendarMerger;