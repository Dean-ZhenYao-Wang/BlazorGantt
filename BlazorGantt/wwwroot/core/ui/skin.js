function _configure(col, data, force) {
  for (var key in data) {
    if (typeof col[key] == "undefined" || force) col[key] = data[key];
  }
}

function _get_skin(force, gantt) {
  var skin = gantt.skin;

  if (!skin || force) {
    var links = document.getElementsByTagName("link");

    for (var i = 0; i < links.length; i++) {
      var res = links[i].href.match("dhtmlxgantt_([a-z_]+).css");

      if (res) {
        if (gantt.skins[res[1]] || !skin) {
          skin = res[1];
          break;
        }
      }
    }
  }

  gantt.skin = skin || "terrace";
  var skinset = gantt.skins[gantt.skin] || gantt.skins["terrace"]; //apply skin related settings

  _configure(gantt.config, skinset.config, force);

  var config = gantt.getGridColumns();
  if (config[1] && !gantt.defined(config[1].width)) config[1].width = skinset._second_column_width;
  if (config[2] && !gantt.defined(config[2].width)) config[2].width = skinset._third_column_width;

  for (var i = 0; i < config.length; i++) {
    var column = config[i];

    if (column.name == "add") {
      if (!column.width) {
        column.width = 44;
      }

      if (!(gantt.defined(column.min_width) && gantt.defined(column.max_width))) {
        column.min_width = column.min_width || column.width;
        column.max_width = column.max_width || column.width;
      }

      if (column.min_width) column.min_width = +column.min_width;
      if (column.max_width) column.max_width = +column.max_width;

      if (column.width) {
        column.width = +column.width;
        column.width = column.min_width && column.min_width > column.width ? column.min_width : column.width;
        column.width = column.max_width && column.max_width < column.width ? column.max_width : column.width;
      }
    }
  }

  if (skinset.config.task_height) {
    gantt.config.task_height = skinset.config.task_height || "full";
  }

  if (skinset.config.bar_height) {
    gantt.config.bar_height = skinset.config.bar_height || "full";
  }

  if (skinset._lightbox_template) gantt._lightbox_template = skinset._lightbox_template;

  if (skinset._redefine_lightbox_buttons) {
    gantt.config.buttons_right = skinset._redefine_lightbox_buttons["buttons_right"];
    gantt.config.buttons_left = skinset._redefine_lightbox_buttons["buttons_left"];
  }

  gantt.resetLightbox();
}

module.exports = function (gantt) {
  if (!gantt.resetSkin) {
    gantt.resetSkin = function () {
      this.skin = "";

      _get_skin(true, this);
    };

    gantt.skins = {};
    gantt.attachEvent("onGanttLayoutReady", function () {
      _get_skin(false, this);
    });
  }
};