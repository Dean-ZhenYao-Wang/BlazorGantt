module.exports = function (gantt) {
  var BaseEditor = require("./base")(gantt),
      utils = require("../../../../../utils/utils");

  var __extends = require("../../../../../utils/extends");

  function TextEditor() {
    var self = BaseEditor.apply(this, arguments) || this;
    return self;
  }

  __extends(TextEditor, BaseEditor);

  function getFormatter(config) {
    return config.formatter || gantt.ext.formatters.durationFormatter();
  }

  utils.mixin(TextEditor.prototype, {
    show: function show(id, column, config, placeholder) {
      var html = "<div role='cell'><input type='text' name='".concat(column.name, "' title='").concat(column.name, "'></div>");
      placeholder.innerHTML = html;
    },
    set_value: function set_value(value, id, column, node) {
      this.get_input(node).value = getFormatter(column.editor).format(value);
    },
    get_value: function get_value(id, column, node) {
      return getFormatter(column.editor).parse(this.get_input(node).value || "");
    }
  }, true);
  return TextEditor;
};