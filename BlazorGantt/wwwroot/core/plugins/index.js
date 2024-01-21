module.exports = function (gantt) {
  if (!gantt.ext) {
    gantt.ext = {};
  }

  var modules = [require("./batch_update"), require("./wbs"), require("./resources"), require("./resource_assignments"), require("./new_task_placeholder"), require("./auto_task_types"), require("./formatters"), require("./empty_state_screen")["default"]];

  for (var i = 0; i < modules.length; i++) {
    if (modules[i]) modules[i](gantt);
  }
};