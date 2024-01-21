function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var utils = require("../../utils/utils"),
    configurable = require("./configurable");

var uiFactory = function createFactory(gantt) {
  var views = {};

  function ui(cell, parentView) {
    var content;
    var view = "cell";

    if (cell.view) {
      view = "viewcell";
    } else if (cell.resizer) {
      view = "resizer";
    } else if (cell.rows || cell.cols) {
      view = "layout";
    } else if (cell.views) {
      view = "multiview";
    }

    content = createView.call(this, view, null, cell, parentView);
    return content;
  }

  var createdViews = {};

  function createView(name, parent, config, parentView) {
    var creator = views[name];
    if (!creator || !creator.create) return false;

    if (name == "resizer" && !config.mode) {
      if (parentView.$config.cols) {
        config.mode = "x";
      } else {
        config.mode = "y";
      }
    }

    if (name == "viewcell" && config.view == "scrollbar" && !config.scroll) {
      if (parentView.$config.cols) {
        config.scroll = "y";
      } else {
        config.scroll = "x";
      }
    }

    var config = utils.copy(config);

    if (!config.id && !createdViews[config.view]) {
      config.id = config.view;
    }

    if (config.id && !config.css) {
      config.css = config.id + "_cell";
    }

    var view = new creator.create(parent, config, this, gantt);

    if (creator.configure) {
      creator.configure(view);
    }

    configurable(view, parentView);

    if (!view.$id) {
      view.$id = config.id || gantt.uid();
    }

    if (!view.$parent && _typeof(parent) == "object") {
      view.$parent = parent;
    }

    if (!view.$config) {
      view.$config = config;
    }

    if (createdViews[view.$id]) {
      view.$id = gantt.uid();
    }

    createdViews[view.$id] = view;
    return view;
  }

  function reset() {
    createdViews = {};
  }

  function register(name, viewConstructor, configure) {
    views[name] = {
      create: viewConstructor,
      configure: configure
    };
  }

  function getView(id) {
    return createdViews[id];
  }

  var factory = {
    initUI: ui,
    reset: reset,
    registerView: register,
    createView: createView,
    getView: getView
  };
  return factory;
};

module.exports = {
  createFactory: uiFactory
};