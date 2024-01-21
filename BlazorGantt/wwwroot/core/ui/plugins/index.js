module.exports = function (gantt) {
  if (!gantt.ext) {
    gantt.ext = {};
  }

  var modules = [require("./autoscroll"), require("./jquery_hooks"), require("./dhtmlx_hooks")];

  for (var i = 0; i < modules.length; i++) {
    if (modules[i]) modules[i](gantt);
  }

  var TimelineZoom = require("./timeline_zoom")["default"];

  gantt.ext.zoom = new TimelineZoom(gantt);
};