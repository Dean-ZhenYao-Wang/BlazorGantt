function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

module.exports = {
  isLegacyResourceCalendarFormat: function isLegacyResourceCalendarFormat(resourceCalendarsProperty) {
    // modern format:
    //gantt.config.resource_calendars = {
    //	resourceId: calendarId,
    //	resourceId: calendarId,
    //	resourceId: calendarId
    //	};
    // legacy format:
    // gantt.config.resource_calendars = {
    //	"resourceProperty": {
    //		resourceId: calendarId,
    //		resourceId: calendarId,
    //		resourceId: calendarId
    //		}
    //	};
    if (!resourceCalendarsProperty) {
      return false;
    }

    for (var i in resourceCalendarsProperty) {
      if (resourceCalendarsProperty[i] && _typeof(resourceCalendarsProperty[i]) === "object") {
        return true;
      }
    }

    return false;
  },
  getResourceProperty: function getResourceProperty(config) {
    var resourceCalendarsConfig = config.resource_calendars;
    var propertyName = config.resource_property;

    if (this.isLegacyResourceCalendarFormat(resourceCalendarsConfig)) {
      for (var i in config) {
        propertyName = i;
        break;
      }
    }

    return propertyName;
  },
  getCalendarIdFromLegacyConfig: function getCalendarIdFromLegacyConfig(task, config) {
    if (config) {
      for (var field in config) {
        var resource = config[field];

        if (task[field]) {
          var calendarId = resource[task[field]];

          if (calendarId) {
            return calendarId;
          }
        }
      }
    }

    return null;
  }
};