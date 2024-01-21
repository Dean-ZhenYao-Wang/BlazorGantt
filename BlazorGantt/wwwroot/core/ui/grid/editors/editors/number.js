module.exports = function (gantt) {
  var BaseEditor = require("./base")(gantt),
      utils = require("../../../../../utils/utils");

  var __extends = require("../../../../../utils/extends");

  function NumberEditor() {
    var self = BaseEditor.apply(this, arguments) || this;
    return self;
  }

  __extends(NumberEditor, BaseEditor);

  utils.mixin(NumberEditor.prototype, {
    show: function show(id, column, config, placeholder) {
      var min = config.min || 0,
          max = config.max || 100;
      var html = "<div role='cell'><input type='number' min='".concat(min, "' max='").concat(max, "' name='").concat(column.name, "' title='").concat(column.name, "'></div>");
      placeholder.innerHTML = html;
    },
    get_value: function get_value(id, column, node) {
      return this.get_input(node).value || "";
    },
    is_valid: function is_valid(value, id, column, node) {
      return !isNaN(parseInt(value, 10));
    }
  }, true);
  return NumberEditor;
};