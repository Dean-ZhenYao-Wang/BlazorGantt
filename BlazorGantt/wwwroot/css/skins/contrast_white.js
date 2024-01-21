module.exports = function (gantt) {
  gantt.skins["contrast_white"] = {
    config: {
      grid_width: 360,
      row_height: 35,
      scale_height: 35,
      link_line_width: 2,
      link_arrow_size: 6,
      lightbox_additional_height: 75
    },
    _second_column_width: 100,
    _third_column_width: 80
  };
};