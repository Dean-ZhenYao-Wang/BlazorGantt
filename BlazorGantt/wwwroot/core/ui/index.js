var uiFactory = require("./ui_factory"),
    mouseEvents = require("./mouse"),
    createLayers = require("./gantt_layers"),
    Cell = require("./layout/cell"),
    Layout = require("./layout/layout"),
    ViewLayout = require("./layout/view_layout"),
    ViewCell = require("./layout/view_cell"),
    Resizer = require("./layout/resizer_cell.gpl.js"),
    Scrollbar = require("./layout/scrollbar_cell"),
    Timeline = require("./timeline/timeline"),
    Grid = require("./grid/grid"),
    ResourceGrid = require("./grid/grid.js"),
    ResourceTimeline = require("./timeline/timeline.js"),
    ResourceHistogram = require("./timeline/timeline.js");

var gridEditorsFactory = require("./grid/editors/controller");

var renderTaskBar = require("./render/task_bar_smart_render"),
    renderSplitTaskBar = require("./render/task_split_render"),
    renderRollupTaskBar = require("./render/task_rollup_render"),
    renderTaskBg = require("./render/task_bg_render"),
    renderLink = require("./render/link_render"),
    gridRenderer = require("./render/task_grid_line_render"),
    resourceMatrixRenderer = require("./render/resource_matrix_render"),
    resourceHistogramRenderer = require("./render/resource_histogram_render"),
    gridTaskRowResizerRenderer = require("./render/task_grid_row_resize_render");

var mainGridInitializer = require("./grid/main_grid_initializer");

var mainTimelineInitializer = require("./timeline/main_timeline_initializer");

var mainLayoutInitializer = require("./main_layout_initializer");

function initUI(gantt) {
  function attachInitializer(view, initializer) {
    var ext = initializer(gantt);
    if (ext.onCreated) ext.onCreated(view);
    view.attachEvent("onReady", function () {
      if (ext.onInitialized) ext.onInitialized(view);
    });
    view.attachEvent("onDestroy", function () {
      if (ext.onDestroyed) ext.onDestroyed(view);
    });
  }

  var factory = uiFactory.createFactory(gantt);
  factory.registerView("cell", Cell);
  factory.registerView("resizer", Resizer);
  factory.registerView("scrollbar", Scrollbar);
  factory.registerView("layout", Layout, function (view) {
    var id = view.$config ? view.$config.id : null;

    if (id === "main") {
      attachInitializer(view, mainLayoutInitializer);
    }
  });
  factory.registerView("viewcell", ViewCell);
  factory.registerView("multiview", ViewLayout);
  factory.registerView("timeline", Timeline, function (view) {
    var id = view.$config ? view.$config.id : null;

    if (id === "timeline" || view.$config.bind == "task") {
      attachInitializer(view, mainTimelineInitializer);
    }
  });
  factory.registerView("grid", Grid, function (view) {
    var id = view.$config ? view.$config.id : null;

    if (id === "grid" || view.$config.bind == "task") {
      attachInitializer(view, mainGridInitializer);
    }
  });
  factory.registerView("resourceGrid", ResourceGrid);
  factory.registerView("resourceTimeline", ResourceTimeline);
  factory.registerView("resourceHistogram", ResourceHistogram);
  var layersEngine = createLayers(gantt);
  var inlineEditors = gridEditorsFactory(gantt);
  gantt.ext.inlineEditors = inlineEditors;
  gantt.ext._inlineEditors = inlineEditors;
  inlineEditors.init(gantt);
  return {
    factory: factory,
    mouseEvents: mouseEvents.init(gantt),
    layersApi: layersEngine.init(),
    render: {
      gridLine: function gridLine() {
        return gridRenderer(gantt);
      },
      taskBg: function taskBg() {
        return renderTaskBg(gantt);
      },
      taskBar: function taskBar() {
        return renderTaskBar(gantt);
      },
      taskRollupBar: function taskRollupBar() {
        return renderRollupTaskBar(gantt);
      },
      taskSplitBar: function taskSplitBar() {
        return renderSplitTaskBar(gantt);
      },
      link: function link() {
        return renderLink(gantt);
      },
      resourceRow: function resourceRow() {
        return resourceMatrixRenderer(gantt);
      },
      resourceHistogram: function resourceHistogram() {
        return resourceHistogramRenderer(gantt);
      },
      gridTaskRowResizer: function gridTaskRowResizer() {
        return gridTaskRowResizerRenderer(gantt);
      }
    },
    layersService: {
      getDataRender: function getDataRender(name) {
        return layersEngine.getDataRender(name, gantt);
      },
      createDataRender: function createDataRender(config) {
        return layersEngine.createDataRender(config, gantt);
      }
    }
  };
}

module.exports = {
  init: initUI
};