//require("css/skins/terrace.less");

var factory = require("./make_instance_common");

module.exports = function (supportedExtensions) {
  var gantt = factory(supportedExtensions);

  if (!gantt.env.isNode) {
    require("../core/ui_core")(gantt);
  }

  return gantt;
};