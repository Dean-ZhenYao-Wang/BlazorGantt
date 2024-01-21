module.exports = function (gantt) {
  var BaseEditor = require("./base")(gantt),
      utils = require("../../../../../utils/utils");

  var __extends = require("../../../../../utils/extends");

  var html5DateFormat = "%Y-%m-%d";
  var dateToStr = null;
  var strToDate = null;

  function init() {
    if (!dateToStr) {
      dateToStr = gantt.date.date_to_str(html5DateFormat);
    }

    if (!strToDate) {
      strToDate = gantt.date.str_to_date(html5DateFormat);
    }
  }

  function DateEditor() {
    var self = BaseEditor.apply(this, arguments) || this;
    return self;
  }

  __extends(DateEditor, BaseEditor);

  utils.mixin(DateEditor.prototype, {
    show: function show(id, column, config, placeholder) {
      init();
      var minValue = null;
      var maxValue = null;

      if (typeof config.min === "function") {
        minValue = config.min(id, column);
      } else {
        minValue = config.min;
      }

      if (typeof config.max === "function") {
        maxValue = config.max(id, column);
      } else {
        maxValue = config.max;
      }

      var minAttr = minValue ? " min='" + dateToStr(minValue) + "' " : "";
      var maxAttr = maxValue ? " max='" + dateToStr(maxValue) + "' " : "";
      var html = "<div style='width:140px' role='cell'><input type='date' ".concat(minAttr, " ").concat(maxAttr, " name='").concat(column.name, "' title='").concat(column.name, "'></div>");
      placeholder.innerHTML = html;
    },
    set_value: function set_value(value, id, column, node) {
      if (value && value.getFullYear) {
        this.get_input(node).value = dateToStr(value);
      } else {
        this.get_input(node).value = value;
      }
    },
    is_valid: function is_valid(value, id, column, node) {
      if (!value || isNaN(value.getTime())) return false;
      return true;
    },
    get_value: function get_value(id, column, node) {
      var parsed;

      try {
        parsed = strToDate(this.get_input(node).value || "");
      } catch (e) {
        parsed = null; // return null will cancel changes
      }

      return parsed;
    }
  }, true);
  return DateEditor;
};