var utils = require("../../../utils/utils");

var rowDnd = require("./tasks_grid_dnd");

var rowDndMarker = require("./tasks_grid_dnd_marker");

var initializer = function () {
  return function (gantt) {
    return {
      onCreated: function onCreated(grid) {
        grid.$config = utils.mixin(grid.$config, {
          bind: "task"
        });

        if (grid.$config.id == "grid") {
          this.extendGantt(grid);
          gantt.ext.inlineEditors = gantt.ext._inlineEditors.createEditors(grid);
          gantt.ext.inlineEditors.init();
        }

        this._mouseDelegates = require("../mouse_event_container")(gantt);
      },
      onInitialized: function onInitialized(grid) {
        var config = grid.$getConfig();

        if (config.order_branch) {
          if (config.order_branch == "marker") {
            rowDndMarker.init(grid.$gantt, grid);
          } else {
            rowDnd.init(grid.$gantt, grid);
          }
        }

        this.initEvents(grid, gantt);

        if (grid.$config.id == "grid") {
          this.extendDom(grid);
        }
      },
      onDestroyed: function onDestroyed(grid) {
        if (grid.$config.id == "grid") {
          gantt.ext.inlineEditors.destructor();
        }

        this.clearEvents(grid, gantt);
      },
      initEvents: function initEvents(grid, gantt) {
        this._mouseDelegates.delegate("click", "gantt_row", gantt.bind(function (e, id, trg) {
          var config = grid.$getConfig();

          if (id !== null) {
            var task = this.getTask(id);
            if (config.scroll_on_click && !gantt._is_icon_open_click(e)) this.showDate(task.start_date);
            gantt.callEvent("onTaskRowClick", [id, trg]);
          }
        }, gantt), grid.$grid);

        this._mouseDelegates.delegate("click", "gantt_grid_head_cell", gantt.bind(function (e, id, trg) {
          var column = trg.getAttribute("data-column-id");
          if (!gantt.callEvent("onGridHeaderClick", [column, e])) return;
          var config = grid.$getConfig();

          if (column == "add") {
            var mouseEvents = gantt.$services.getService("mouseEvents");
            mouseEvents.callHandler("click", "gantt_add", grid.$grid, [e, config.root_id]);
            return;
          }

          if (config.sort && column) {
            // GS-929: if there is no column name, we cannot sort the column
            var sorting_method = column,
                conf;

            for (var i = 0; i < config.columns.length; i++) {
              if (config.columns[i].name == column) {
                conf = config.columns[i];
                break;
              }
            }

            if (conf && conf.sort !== undefined && conf.sort !== true) {
              sorting_method = conf.sort;

              if (!sorting_method) {
                // column sort property 'false', no sorting
                return;
              }
            }

            var sort = this._sort && this._sort.direction && this._sort.name == column ? this._sort.direction : "desc"; // invert sort direction

            sort = sort == "desc" ? "asc" : "desc";
            this._sort = {
              name: column,
              direction: sort
            };
            this.sort(sorting_method, sort == "desc");
          }
        }, gantt), grid.$grid);

        this._mouseDelegates.delegate("click", "gantt_add", gantt.bind(function (e, id, trg) {
          var config = grid.$getConfig();
          if (config.readonly) return;
          var item = {};
          this.createTask(item, id ? id : gantt.config.root_id);
          return false;
        }, gantt), grid.$grid);
      },
      clearEvents: function clearEvents(grid, gantt) {
        this._mouseDelegates.destructor();

        this._mouseDelegates = null;
      },
      extendDom: function extendDom(grid) {
        gantt.$grid = grid.$grid;
        gantt.$grid_scale = grid.$grid_scale;
        gantt.$grid_data = grid.$grid_data;
      },
      extendGantt: function extendGantt(grid) {
        gantt.getGridColumns = gantt.bind(grid.getGridColumns, grid);
        grid.attachEvent("onColumnResizeStart", function () {
          return gantt.callEvent("onColumnResizeStart", arguments);
        });
        grid.attachEvent("onColumnResize", function () {
          return gantt.callEvent("onColumnResize", arguments);
        });
        grid.attachEvent("onColumnResizeEnd", function () {
          return gantt.callEvent("onColumnResizeEnd", arguments);
        });
        grid.attachEvent("onColumnResizeComplete", function (columns, totalWidth) {
          gantt.config.grid_width = totalWidth;
        });
        grid.attachEvent("onBeforeRowResize", function () {
          return gantt.callEvent("onBeforeRowResize", arguments);
        });
        grid.attachEvent("onRowResize", function () {
          return gantt.callEvent("onRowResize", arguments);
        });
        grid.attachEvent("onBeforeRowResizeEnd", function () {
          return gantt.callEvent("onBeforeRowResizeEnd", arguments);
        });
        grid.attachEvent("onAfterRowResize", function () {
          return gantt.callEvent("onAfterRowResize", arguments);
        });
      }
    };
  };
}();

module.exports = initializer;