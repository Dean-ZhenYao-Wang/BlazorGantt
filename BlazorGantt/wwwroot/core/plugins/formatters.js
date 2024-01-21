var DurationFormatter = require("../common/duration_formatter_numeric")["default"];

var LinkFormatter = require("../common/link_formatter_simple")["default"];

module.exports = function (gantt) {
  gantt.ext.formatters = {
    durationFormatter: function durationFormatter(settings) {
      if (!settings) {
        settings = {};
      }

      if (!settings.store) {
        settings.store = gantt.config.duration_unit;
      }

      if (!settings.enter) {
        settings.enter = gantt.config.duration_unit;
      }

      return DurationFormatter.create(settings, gantt);
    },
    linkFormatter: function linkFormatter(settings) {
      return LinkFormatter.create(settings, gantt);
    }
  };
};