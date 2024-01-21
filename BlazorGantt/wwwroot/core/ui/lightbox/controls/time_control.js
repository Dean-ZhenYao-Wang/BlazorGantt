var __extends = require("../../../../utils/extends");

module.exports = function (gantt) {
  var _super = require("./base_control")(gantt);

  function TimeControl() {
    var self = _super.apply(this, arguments) || this;
    return self;
  }

  __extends(TimeControl, _super);

  TimeControl.prototype.render = function (sns) {
    var time = gantt.form_blocks.getTimePicker.call(this, sns);
    var html = "<div style='height:" + (sns.height || 30) + "px;padding-top:0px;font-size:inherit;text-align:center;' class='gantt_section_time'>";
    html += time;

    if (sns.single_date) {
      time = gantt.form_blocks.getTimePicker.call(this, sns, true);
      html += "<span></span>";
    } else {
      html += "<span style='font-weight:normal; font-size:10pt;'> &nbsp;&ndash;&nbsp; </span>";
    }

    html += time;
    html += "</div>";
    return html;
  };

  TimeControl.prototype.set_value = function (node, value, ev, config) {
    var cfg = config;
    var s = node.getElementsByTagName("select");
    var map = config._time_format_order;

    if (cfg.auto_end_date) {
      var _update_lightbox_select = function _update_lightbox_select() {
        start_date = new Date(s[map[2]].value, s[map[1]].value, s[map[0]].value, 0, 0);
        end_date = gantt.calculateEndDate({
          start_date: start_date,
          duration: 1,
          task: ev
        });

        gantt.form_blocks._fill_lightbox_select(s, map.size, end_date, map, cfg);
      };

      for (var i = 0; i < 4; i++) {
        s[i].onchange = _update_lightbox_select;
      }
    }

    var mapping = gantt._resolve_default_mapping(config);

    if (typeof mapping === "string") mapping = {
      start_date: mapping
    };
    var start_date = ev[mapping.start_date] || new Date();
    var end_date = ev[mapping.end_date] || gantt.calculateEndDate({
      start_date: start_date,
      duration: 1,
      task: ev
    });

    gantt.form_blocks._fill_lightbox_select(s, 0, start_date, map, cfg);

    gantt.form_blocks._fill_lightbox_select(s, map.size, end_date, map, cfg);
  };

  TimeControl.prototype.get_value = function (node, ev, config) {
    var selects = node.getElementsByTagName("select");
    var startDate;
    var map = config._time_format_order;

    function _getEndDate(selects, map, startDate) {
      var endDate = gantt.form_blocks.getTimePickerValue(selects, config, map.size); // GS-1010: We need to add a way to obtain exact end_date for validation

      if (endDate <= startDate) {
        // when end date seems wrong
        if (config.autofix_end !== false || config.single_date) {
          // auto correct it in two cases - when the auto correction is not disabled, or when we have 'single date' control and the user don't have the UI to specify the end date
          return gantt.date.add(startDate, gantt._get_timepicker_step(), "minute");
        }
      }

      return endDate;
    }

    startDate = gantt.form_blocks.getTimePickerValue(selects, config);

    if (typeof gantt._resolve_default_mapping(config) === "string") {
      return startDate;
    }

    return {
      start_date: startDate,
      end_date: _getEndDate(selects, map, startDate)
    };
  };

  TimeControl.prototype.focus = function (node) {
    gantt._focus(node.getElementsByTagName("select")[0]);
  };

  return TimeControl;
};