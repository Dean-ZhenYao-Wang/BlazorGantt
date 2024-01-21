var __extends = require("../../../../utils/extends");

var htmlHelpers = require("../../utils/html_helpers");

module.exports = function (gantt) {
  var _super = require("./base_control")(gantt);

  function SelectControl() {
    var self = _super.apply(this, arguments) || this;
    return self;
  }

  __extends(SelectControl, _super);

  SelectControl.prototype.render = function (sns) {
    var height = (sns.height || "23") + "px";
    var html = "<div class='gantt_cal_ltext' style='height:" + height + ";'>";
    html += htmlHelpers.getHtmlSelect(sns.options, [{
      key: "style",
      value: "width:100%;"
    }, {
      key: "title",
      value: sns.name
    }]);
    html += "</div>";
    return html;
  };

  SelectControl.prototype.set_value = function (node, value, ev, sns) {
    var select = node.firstChild;

    if (!select._dhx_onchange && sns.onchange) {
      select.onchange = sns.onchange;
      select._dhx_onchange = true;
    }

    if (typeof value === "undefined") value = (select.options[0] || {}).value;
    select.value = value || "";
  };

  SelectControl.prototype.get_value = function (node) {
    return node.firstChild.value;
  };

  SelectControl.prototype.focus = function (node) {
    var a = node.firstChild;

    gantt._focus(a, true);
  };

  return SelectControl;
};