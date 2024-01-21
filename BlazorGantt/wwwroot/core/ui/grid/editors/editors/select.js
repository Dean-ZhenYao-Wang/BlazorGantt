module.exports = function (gantt) {
  var BaseEditor = require("./base")(gantt),
      utils = require("../../../../../utils/utils");

  var __extends = require("../../../../../utils/extends");

  function SelectEditor() {
    var self = BaseEditor.apply(this, arguments) || this;
    return self;
  }

  __extends(SelectEditor, BaseEditor);

  utils.mixin(SelectEditor.prototype, {
    show: function show(id, column, config, placeholder) {
      var html = "<div role='cell'><select name='".concat(column.name, "' title='").concat(column.name, "'>");
      var optionsHtml = [],
          options = config.options || [];

      for (var i = 0; i < options.length; i++) {
        optionsHtml.push("<option value='" + config.options[i].key + "'>" + options[i].label + "</option>");
      }

      html += optionsHtml.join("") + "</select></div>";
      placeholder.innerHTML = html;
    },
    get_input: function get_input(node) {
      return node.querySelector("select");
    }
  }, true);
  return SelectEditor;
};