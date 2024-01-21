module.exports = function (gantt) {
  var BaseEditor = require("./base")(gantt),
      utils = require("../../../../../utils/utils");

  var __extends = require("../../../../../utils/extends");

  function TextEditor() {
    var self = BaseEditor.apply(this, arguments) || this;
    return self;
  }

  __extends(TextEditor, BaseEditor);

  utils.mixin(TextEditor.prototype, {
    show: function show(id, column, config, placeholder) {
      var html = "<div role='cell'><input type='text' name='".concat(column.name, "' title='").concat(column.name, "'></div>");
      placeholder.innerHTML = html;
    }
  }, true);
  return TextEditor;
};