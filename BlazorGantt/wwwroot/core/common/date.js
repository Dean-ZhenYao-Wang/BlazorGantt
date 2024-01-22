/*
 %d - the day as a number with a leading zero ( 01 to 31 );
 %j - the day as a number without a leading zero ( 1 to 31 );
 %D - the day as an abbreviation ( Sun to Sat );
 %l - the day as a full name ( Sunday to Saturday );
 %W - the ISO-8601 week number of the year. Weeks start on Monday; 1)
 %m - the month as a number without a leading zero ( 1 to 12 );
 %n - the month as a number with a leading zero ( 01 to 12);
 %M - the month as an abbreviation ( Jan to Dec );
 %F - the month as a full name ( January to December );
 %y - the year as a two-digit number ( 00 to 99 );
 %Y - the year as a four-digit number ( 1900–9999 );
 %h - the hour based on the 12-hour clock ( 00 to 11 );
 %H - the hour based on the 24-hour clock ( 00 to 23 );
 %i - the minute as a number with a leading zero ( 00 to 59 );
 %s - the second as a number without a leading zero ( 00 to 59 ); 2)
 %a - displays am (for times from midnight until noon) and pm (for times from noon until midnight);
 %A - displays AM (for times from midnight until noon) and PM (for times from noon until midnight).
*/
var fastVersion = require("./date_parsers/fast_version")["default"];

var cspCompliantVersion = require("./date_parsers/csp_compliant_version")["default"];

module.exports = function (gantt) {
    var canUseCsp = null;

    function cspAutoCheck() {
        try {
            new Function("canUseCsp = false;");
        } catch (e) {
            canUseCsp = true;
        }
    }

    function useCsp() {
        var result = false;

        if (gantt.config.csp === "auto") {
            if (canUseCsp === null) {
                cspAutoCheck();
            }

            result = canUseCsp;
        } else {
            result = gantt.config.csp;
        }

        return result;
    }

    var dateHelper = {
        init: function init() {
            var locale = gantt.locale;
            var s = locale.date.month_short;
            var t = locale.date.month_short_hash = {};

            for (var i = 0; i < s.length; i++) {
                t[s[i]] = i;
            }

            var s = locale.date.month_full;
            var t = locale.date.month_full_hash = {};

            for (var i = 0; i < s.length; i++) {
                t[s[i]] = i;
            }
        },
        date_part: function date_part(date) {
            var old = new Date(date);
            date.setHours(0);
            this.hour_start(date);
            if (date.getHours() && ( //shift to yesterday on dst
                date.getDate() < old.getDate() || date.getMonth() < old.getMonth() || date.getFullYear() < old.getFullYear())) date.setTime(date.getTime() + 60 * 60 * 1000 * (24 - date.getHours()));
            return date;
        },
        time_part: function time_part(date) {
            return (date.valueOf() / 1000 - date.getTimezoneOffset() * 60) % 86400;
        },
        week_start: function week_start(date) {
            var shift = date.getDay();

            if (gantt.config.start_on_monday) {
                if (shift === 0) shift = 6; else shift--;
            }

            return this.date_part(this.add(date, -1 * shift, "day"));
        },
        month_start: function month_start(date) {
            date.setDate(1);
            return this.date_part(date);
        },
        quarter_start: function quarter_start(date) {
            this.month_start(date);
            var m = date.getMonth(),
                res_month;

            if (m >= 9) {
                res_month = 9;
            } else if (m >= 6) {
                res_month = 6;
            } else if (m >= 3) {
                res_month = 3;
            } else {
                res_month = 0;
            }

            date.setMonth(res_month);
            return date;
        },
        year_start: function year_start(date) {
            date.setMonth(0);
            return this.month_start(date);
        },
        day_start: function day_start(date) {
            return this.date_part(date);
        },
        hour_start: function hour_start(date) {
            if (date.getMinutes()) date.setMinutes(0);
            this.minute_start(date);
            return date;
        },
        minute_start: function minute_start(date) {
            if (date.getSeconds()) date.setSeconds(0);
            if (date.getMilliseconds()) date.setMilliseconds(0);
            return date;
        },
        _add_days: function _add_days(modifiedDate, inc, originalDate) {
            modifiedDate.setDate(modifiedDate.getDate() + inc);
            var incCondition = inc >= 0;
            var getHoursCondition = !originalDate.getHours() && modifiedDate.getHours(); //shift to yesterday on dst

            var getDateCondition = modifiedDate.getDate() <= originalDate.getDate() || modifiedDate.getMonth() < originalDate.getMonth() || modifiedDate.getFullYear() < originalDate.getFullYear();

            if (incCondition && getHoursCondition && getDateCondition) {
                modifiedDate.setTime(modifiedDate.getTime() + 60 * 60 * 1000 * (24 - modifiedDate.getHours()));
            }

            var worktimeCalculation = inc > 1;

            if (worktimeCalculation && getHoursCondition) {
                // try to shift the modified Date to 00:00
                modifiedDate.setHours(0);
            }

            return modifiedDate;
        },
        add: function add(date, inc, mode) {
            /*jsl:ignore*/
            var ndate = new Date(date.valueOf());

            switch (mode) {
                case "day":
                    ndate = this._add_days(ndate, inc, date);
                    break;

                case "week":
                    ndate = this._add_days(ndate, inc * 7, date);
                    break;

                case "month":
                    ndate.setMonth(ndate.getMonth() + inc);
                    break;

                case "year":
                    ndate.setYear(ndate.getFullYear() + inc);
                    break;

                case "hour":
                    /*
                          adding hours/minutes via setHour(getHour() + inc) gives weird result when
                          adding one hour to the time before switch to a Daylight Saving time
                                  example: //Sun Mar 30 2014 01:00:00 GMT+0100 (W. Europe Standard Time)
                          new Date(2014, 02, 30, 1).setHours(2)
                          >>Sun Mar 30 2014 01:00:00 GMT+0100 (W. Europe Standard Time)
                                  setTime seems working as expected
                     */
                    ndate.setTime(ndate.getTime() + inc * 60 * 60 * 1000);
                    break;

                case "minute":
                    ndate.setTime(ndate.getTime() + inc * 60 * 1000);
                    break;

                default:
                    return this["add_" + mode](date, inc, mode);
            }

            return ndate;
            /*jsl:end*/
        },
        add_quarter: function add_quarter(date, inc) {
            return this.add(date, inc * 3, "month");
        },
        to_fixed: function to_fixed(num) {
            if (num < 10) return "0" + num;
            return num;
        },
        copy: function copy(date) {
            return new Date(date.valueOf());
        },
        date_to_str: function date_to_str(format, utc) {
            var result = fastVersion;

            if (useCsp()) {
                result = cspCompliantVersion;
            }

            return result.date_to_str(format, utc, gantt);
        },
        str_to_date: function str_to_date(format, utc) {
            var result = fastVersion;

            if (useCsp()) {
                result = cspCompliantVersion;
            }

            return result.str_to_date(format, utc, gantt);
        },
        getISOWeek: function getISOWeek(ndate) {
            return gantt.date._getWeekNumber(ndate, true);
        },
        _getWeekNumber: function _getWeekNumber(ndate, isoWeek) {
            if (!ndate) return false;
            var nday = ndate.getDay();

            if (isoWeek) {
                if (nday === 0) {
                    nday = 7;
                }
            }

            var first_thursday = new Date(ndate.valueOf());
            first_thursday.setDate(ndate.getDate() + (4 - nday));
            var year_number = first_thursday.getFullYear(); // year of the first Thursday

            var ordinal_date = Math.round((first_thursday.getTime() - new Date(year_number, 0, 1).getTime()) / 86400000); //ordinal date of the first Thursday - 1 (so not really ordinal date)

            var week_number = 1 + Math.floor(ordinal_date / 7);
            return week_number;
        },
        getWeek: function getWeek(ndate) {
            return gantt.date._getWeekNumber(ndate, gantt.config.start_on_monday);
        },
        getUTCISOWeek: function getUTCISOWeek(ndate) {
            return gantt.date.getISOWeek(ndate);
        },
        convert_to_utc: function convert_to_utc(date) {
            return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
        },
        parseDate: function parseDate(date, format) {
            // raw date may be of type string, number (timestamp) or something else
            // do not check for instanceof Date explicitly, since we may swap native date with different date implementation at some point
            let ft = undefined;
            if (date && !date.getFullYear) {
                if (typeof format !== "function") {
                    if (typeof format === "string") {
                        ft = gantt.defined(gantt.templates[format]) ? gantt.templates[format] : gantt.date.str_to_date(format);
                    } else {
                        ft = gantt.defined(gantt.templates.xml_date) ? gantt.templates.xml_date : gantt.templates.parse_date;
                    }
                }

                if (date) {
                    date = ft(date);
                } else {
                    date = null;
                }
            }

            return date;
        }
    };
    return dateHelper;
};