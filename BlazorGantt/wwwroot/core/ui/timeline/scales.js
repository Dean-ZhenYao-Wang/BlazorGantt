var utils = require("../../../utils/utils");

function ScaleHelper(gantt) {
  var dateHelper = gantt.date;
  var services = gantt.$services;
  return {
    getSum: function getSum(sizes, from, to) {
      if (to === undefined) to = sizes.length - 1;
      if (from === undefined) from = 0;
      var summ = 0;

      for (var i = from; i <= to; i++) {
        summ += sizes[i];
      }

      return summ;
    },
    setSumWidth: function setSumWidth(sum_width, scale, from, to) {
      var parts = scale.width;
      if (to === undefined) to = parts.length - 1;
      if (from === undefined) from = 0;
      var length = to - from + 1;
      if (from > parts.length - 1 || length <= 0 || to > parts.length - 1) return;
      var oldWidth = this.getSum(parts, from, to);
      var diff = sum_width - oldWidth;
      this.adjustSize(diff, parts, from, to);
      this.adjustSize(-diff, parts, to + 1);
      scale.full_width = this.getSum(parts);
    },
    splitSize: function splitSize(width, count) {
      var arr = [];

      for (var i = 0; i < count; i++) {
        arr[i] = 0;
      }

      this.adjustSize(width, arr);
      return arr;
    },
    adjustSize: function adjustSize(width, parts, from, to) {
      if (!from) from = 0;
      if (to === undefined) to = parts.length - 1;
      var length = to - from + 1;
      var full = this.getSum(parts, from, to);

      for (var i = from; i <= to; i++) {
        var share = Math.floor(width * (full ? parts[i] / full : 1 / length));
        full -= parts[i];
        width -= share;
        length--;
        parts[i] += share;
      }

      parts[parts.length - 1] += width;
    },
    sortScales: function sortScales(scales) {
      function cellSize(unit, step) {
        var d = new Date(1970, 0, 1);
        return dateHelper.add(d, step, unit) - d;
      }

      scales.sort(function (a, b) {
        if (cellSize(a.unit, a.step) < cellSize(b.unit, b.step)) {
          return 1;
        } else if (cellSize(a.unit, a.step) > cellSize(b.unit, b.step)) {
          return -1;
        } else {
          return 0;
        }
      });

      for (var i = 0; i < scales.length; i++) {
        scales[i].index = i;
      }
    },
    _isLegacyMode: function _isLegacyMode(config) {
      var scaleConfig = config || gantt.config;
      return scaleConfig.scale_unit || scaleConfig.date_scale || scaleConfig.subscales;
    },
    _prepareScaleObject: function _prepareScaleObject(scale) {
      var format = scale.format;

      if (!format) {
        format = scale.template || scale.date || "%d %M";
      }

      if (typeof format === "string") {
        format = gantt.date.date_to_str(format);
      }

      return {
        unit: scale.unit || "day",
        step: scale.step || 1,
        format: format,
        css: scale.css
      };
    },
    primaryScale: function primaryScale(config) {
      var templates = services.getService("templateLoader");

      var legacyMode = this._isLegacyMode(config);

      var scaleConfig = config || gantt.config;
      var result;

      if (legacyMode) {
        templates.initTemplate("date_scale", undefined, undefined, scaleConfig, gantt.config.templates);
        result = {
          unit: gantt.config.scale_unit,
          step: gantt.config.step,
          template: gantt.templates.date_scale,
          date: gantt.config.date_scale,
          css: gantt.templates.scale_cell_class
        };
      } else {
        var primaryScale = scaleConfig.scales[0];
        result = {
          unit: primaryScale.unit,
          step: primaryScale.step,
          template: primaryScale.template,
          format: primaryScale.format,
          date: primaryScale.date,
          css: primaryScale.css || gantt.templates.scale_cell_class
        };
      }

      return this._prepareScaleObject(result);
    },
    getSubScales: function getSubScales(config) {
      var legacyMode = this._isLegacyMode(config);

      var scaleConfig = config || gantt.config;
      var scales;

      if (legacyMode) {
        scales = scaleConfig.subscales || [];
      } else {
        scales = scaleConfig.scales.slice(1);
      }

      return scales.map(function (scale) {
        return this._prepareScaleObject(scale);
      }.bind(this));
    },
    prepareConfigs: function prepareConfigs(scales, min_coll_width, container_width, scale_height, minDate, maxDate, rtl) {
      var heights = this.splitSize(scale_height, scales.length);
      var full_width = container_width;
      var configs = [];

      for (var i = scales.length - 1; i >= 0; i--) {
        var main_scale = i == scales.length - 1;
        var cfg = this.initScaleConfig(scales[i], minDate, maxDate);

        if (main_scale) {
          this.processIgnores(cfg);
        }

        this.initColSizes(cfg, min_coll_width, full_width, heights[i]);
        this.limitVisibleRange(cfg);

        if (main_scale) {
          full_width = cfg.full_width;
        }

        configs.unshift(cfg);
      }

      for (var i = 0; i < configs.length - 1; i++) {
        this.alineScaleColumns(configs[configs.length - 1], configs[i]);
      }

      for (var i = 0; i < configs.length; i++) {
        if (rtl) {
          this.reverseScale(configs[i]);
        }

        this.setPosSettings(configs[i]);
      }

      return configs;
    },
    reverseScale: function reverseScale(scale) {
      scale.width = scale.width.reverse();
      scale.trace_x = scale.trace_x.reverse();
      var indexes = scale.trace_indexes;
      scale.trace_indexes = {};
      scale.trace_index_transition = {};
      scale.rtl = true;

      for (var i = 0; i < scale.trace_x.length; i++) {
        scale.trace_indexes[scale.trace_x[i].valueOf()] = i;
        scale.trace_index_transition[indexes[scale.trace_x[i].valueOf()]] = i;
      }

      return scale;
    },
    setPosSettings: function setPosSettings(config) {
      for (var i = 0, len = config.trace_x.length; i < len; i++) {
        config.left.push((config.width[i - 1] || 0) + (config.left[i - 1] || 0));
      }
    },
    _ignore_time_config: function _ignore_time_config(date, scale) {
      if (gantt.config.skip_off_time) {
        var skip = true;
        var probe = date; // check dates in case custom scale unit, e.g. {unit: "month", step: 3}

        for (var i = 0; i < scale.step; i++) {
          if (i) {
            probe = dateHelper.add(date, i, scale.unit);
          }

          skip = skip && !this.isWorkTime(probe, scale.unit);
        }

        return skip;
      }

      return false;
    },
    //defined in an extension
    processIgnores: function processIgnores(config) {
      config.ignore_x = {};
      config.display_count = config.count;
    },
    initColSizes: function initColSizes(config, min_col_width, full_width, line_height) {
      var cont_width = full_width;
      config.height = line_height;
      var column_count = config.display_count === undefined ? config.count : config.display_count;
      if (!column_count) column_count = 1;
      config.col_width = Math.floor(cont_width / column_count);

      if (min_col_width) {
        if (config.col_width < min_col_width) {
          config.col_width = min_col_width;
          cont_width = config.col_width * column_count;
        }
      }

      config.width = [];
      var ignores = config.ignore_x || {};

      for (var i = 0; i < config.trace_x.length; i++) {
        if (ignores[config.trace_x[i].valueOf()] || config.display_count == config.count) {
          config.width[i] = 0;
        } else {
          // width of month columns should be proportional month duration
          var width = 1;

          if (config.unit == "month") {
            var days = Math.round((dateHelper.add(config.trace_x[i], config.step, config.unit) - config.trace_x[i]) / (1000 * 60 * 60 * 24));
            width = days;
          }

          config.width[i] = width;
        }
      }

      this.adjustSize(cont_width - this.getSum(config.width)
      /* 1 width per column from the code above */
      , config.width);
      config.full_width = this.getSum(config.width);
    },
    initScaleConfig: function initScaleConfig(config, min_date, max_date) {
      var cfg = utils.mixin({
        count: 0,
        col_width: 0,
        full_width: 0,
        height: 0,
        width: [],
        left: [],
        trace_x: [],
        trace_indexes: {},
        min_date: new Date(min_date),
        max_date: new Date(max_date)
      }, config);
      this.eachColumn(config.unit, config.step, min_date, max_date, function (date) {
        cfg.count++;
        cfg.trace_x.push(new Date(date));
        cfg.trace_indexes[date.valueOf()] = cfg.trace_x.length - 1;
      });
      cfg.trace_x_ascending = cfg.trace_x.slice();
      return cfg;
    },
    iterateScales: function iterateScales(lower_scale, upper_scale, from, to, callback) {
      var upper_dates = upper_scale.trace_x;
      var lower_dates = lower_scale.trace_x;
      var prev = from || 0;
      var end = to || lower_dates.length - 1;
      var prevUpper = 0;

      for (var up = 1; up < upper_dates.length; up++) {
        var target_index = lower_scale.trace_indexes[+upper_dates[up]];

        if (target_index !== undefined && target_index <= end) {
          if (callback) {
            callback.apply(this, [prevUpper, up, prev, target_index]);
          }

          prev = target_index;
          prevUpper = up;
          continue;
        }
      }
    },
    alineScaleColumns: function alineScaleColumns(lower_scale, upper_scale, from, to) {
      this.iterateScales(lower_scale, upper_scale, from, to, function (upper_start, upper_end, lower_start, lower_end) {
        var targetWidth = this.getSum(lower_scale.width, lower_start, lower_end - 1);
        var actualWidth = this.getSum(upper_scale.width, upper_start, upper_end - 1);

        if (actualWidth != targetWidth) {
          this.setSumWidth(targetWidth, upper_scale, upper_start, upper_end - 1);
        }
      });
    },
    eachColumn: function eachColumn(unit, step, min_date, max_date, callback) {
      var start = new Date(min_date),
          end = new Date(max_date);

      if (dateHelper[unit + "_start"]) {
        start = dateHelper[unit + "_start"](start);
      }

      var curr = new Date(start);

      if (+curr >= +end) {
        end = dateHelper.add(curr, step, unit);
      }

      while (+curr < +end) {
        callback.call(this, new Date(curr));
        var tzOffset = curr.getTimezoneOffset();
        curr = dateHelper.add(curr, step, unit);
        curr = gantt._correct_dst_change(curr, tzOffset, step, unit);
        if (dateHelper[unit + '_start']) curr = dateHelper[unit + "_start"](curr);
      }
    },
    limitVisibleRange: function limitVisibleRange(cfg) {
      var dates = cfg.trace_x;
      var left = 0,
          right = cfg.width.length - 1;
      var diff = 0;

      if (+dates[0] < +cfg.min_date && left != right) {
        var width = Math.floor(cfg.width[0] * ((dates[1] - cfg.min_date) / (dates[1] - dates[0])));
        diff += cfg.width[0] - width;
        cfg.width[0] = width;
        dates[0] = new Date(cfg.min_date);
      }

      var last = dates.length - 1;
      var lastDate = dates[last];
      var outDate = dateHelper.add(lastDate, cfg.step, cfg.unit);

      if (+outDate > +cfg.max_date && last > 0) {
        var width = cfg.width[last] - Math.floor(cfg.width[last] * ((outDate - cfg.max_date) / (outDate - lastDate)));
        diff += cfg.width[last] - width;
        cfg.width[last] = width;
      }

      if (diff) {
        var full = this.getSum(cfg.width);
        var shared = 0;

        for (var i = 0; i < cfg.width.length; i++) {
          var share = Math.floor(diff * (cfg.width[i] / full));
          cfg.width[i] += share;
          shared += share;
        }

        this.adjustSize(diff - shared, cfg.width);
      }
    }
  };
}

module.exports = ScaleHelper;