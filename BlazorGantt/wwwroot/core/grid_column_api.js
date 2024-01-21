var Grid = require("./ui/grid/grid");

module.exports = function (gantt) {
  require("./grid_column_api.gpl")(gantt);

  Grid.prototype.getGridColumns = function () {
    var config = this.$getConfig();
    var columns = config.columns,
        visibleColumns = [];

    for (var i = 0; i < columns.length; i++) {
      if (!columns[i].hide) visibleColumns.push(columns[i]);
    }

    return visibleColumns;
  };
};