var __extends = require("../../../../utils/extends");

module.exports = function (gantt) {
  var _super = require("./base_control")(gantt);

  function TemplateControl() {
    var self = _super.apply(this, arguments) || this;
    return self;
  }

  __extends(TemplateControl, _super);

  TemplateControl.prototype.render = function (sns) {
    var height = (sns.height || "30") + "px";
    return "<div class='gantt_cal_ltext gantt_cal_template' style='height:" + height + ";'></div>";
  };

  TemplateControl.prototype.set_value = function (node, value) {
    node.innerHTML = value || "";
  };

  TemplateControl.prototype.get_value = function (node) {
    return node.innerHTML || "";
  };

  TemplateControl.prototype.focus = function () {};

  return TemplateControl;
};