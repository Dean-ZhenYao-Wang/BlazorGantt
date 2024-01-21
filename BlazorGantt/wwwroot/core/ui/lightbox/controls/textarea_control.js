var __extends = require("../../../../utils/extends");

module.exports = function (gantt) {
  var _super = require("./base_control")(gantt);

  function TextareaControl() {
    var self = _super.apply(this, arguments) || this;
    return self;
  }

  __extends(TextareaControl, _super);

  TextareaControl.prototype.render = function (sns) {
    var height = (sns.height || "130") + "px";
    return "<div class='gantt_cal_ltext' style='height:" + height + ";'><textarea></textarea></div>";
  };

  TextareaControl.prototype.set_value = function (node, value) {
    gantt.form_blocks.textarea._get_input(node).value = value || "";
  };

  TextareaControl.prototype.get_value = function (node) {
    return gantt.form_blocks.textarea._get_input(node).value;
  };

  TextareaControl.prototype.focus = function (node) {
    var a = gantt.form_blocks.textarea._get_input(node);

    gantt._focus(a, true);
  };

  TextareaControl.prototype._get_input = function (node) {
    return node.querySelector("textarea");
  };

  return TextareaControl;
};