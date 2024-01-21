module.exports = function (gantt) {
  gantt.skins.material = {
    config: {
      grid_width: 411,
      row_height: 34,
      task_height_offset: 6,
      scale_height: 36,
      link_line_width: 2,
      link_arrow_size: 6,
      lightbox_additional_height: 80
    },
    _second_column_width: 110,
    _third_column_width: 75,
    _redefine_lightbox_buttons: {
      "buttons_left": ["dhx_delete_btn"],
      "buttons_right": ["dhx_save_btn", "dhx_cancel_btn"]
    }
  };
  gantt.attachEvent("onAfterTaskDrag", function (id) {
    var t = gantt.getTaskNode(id);

    if (t) {
      t.className += " gantt_drag_animation";
      setTimeout(function () {
        var indx = t.className.indexOf(" gantt_drag_animation");

        if (indx > -1) {
          t.className = t.className.slice(0, indx);
        }
      }, 200);
    }
  });
};