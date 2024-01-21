module.exports = function (gantt) {
  gantt.getGridColumn = function (name) {
    var columns = gantt.config.columns;

    for (var i = 0; i < columns.length; i++) {
      if (columns[i].name == name) return columns[i];
    }

    return null;
  };

  gantt.getGridColumns = function () {
    return gantt.config.columns.slice();
  };
};