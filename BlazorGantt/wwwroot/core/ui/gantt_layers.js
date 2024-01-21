var createLayerFactory = require("./render/layer_engine");

var getVisibleTaskRange = require("./render/viewport/get_visible_bars_range");

var getVisibleLinksRangeFactory = require("./render/viewport/factory/get_visible_link_range");

var isLinkInViewport = require("./render/viewport/is_link_in_viewport");

function initLayer(layer, gantt) {
  if (!layer.view) {
    return;
  }

  var view = layer.view;

  if (typeof view === "string") {
    view = gantt.$ui.getView(view);
  }

  if (view && view.attachEvent) {
    view.attachEvent("onScroll", function () {
      var state = gantt.$services.getService("state"); // don't repaint if we're inside batchUpdate, a complete repaint will be called afterwards

      if (!state.getState("batchUpdate").batch_update && !view.$config.$skipSmartRenderOnScroll) {
        if (layer.requestUpdate) {
          layer.requestUpdate();
        }
      }
    });
  }
}

var createLayerEngine = function createLayerEngine(gantt) {
  var factory = createLayerFactory(gantt);
  return {
    getDataRender: function getDataRender(name) {
      return gantt.$services.getService("layer:" + name) || null;
    },
    createDataRender: function createDataRender(config) {
      var name = config.name,
          defaultContainer = config.defaultContainer,
          previusSiblingContainer = config.defaultContainerSibling;
      var layers = factory.createGroup(defaultContainer, previusSiblingContainer, function (itemId, item) {
        if (layers.filters) {
          for (var i = 0; i < layers.filters.length; i++) {
            if (layers.filters[i](itemId, item) === false) {
              return false;
            }
          }
        } else {
          return true;
        }
      }, initLayer);
      gantt.$services.setService("layer:" + name, function () {
        return layers;
      });
      gantt.attachEvent("onGanttReady", function () {
        layers.addLayer(); // init layers on start
      });
      return layers;
    },
    init: function init() {
      var taskLayers = this.createDataRender({
        name: "task",
        defaultContainer: function defaultContainer() {
          if (gantt.$task_data) {
            return gantt.$task_data;
          } else if (gantt.$ui.getView("timeline")) {
            return gantt.$ui.getView("timeline").$task_data;
          }
        },
        defaultContainerSibling: function defaultContainerSibling() {
          if (gantt.$task_links) {
            return gantt.$task_links;
          } else if (gantt.$ui.getView("timeline")) {
            return gantt.$ui.getView("timeline").$task_links;
          }
        },
        filter: function filter(item) {}
      }, gantt);
      var linkLayers = this.createDataRender({
        name: "link",
        defaultContainer: function defaultContainer() {
          if (gantt.$task_data) {
            return gantt.$task_data;
          } else if (gantt.$ui.getView("timeline")) {
            return gantt.$ui.getView("timeline").$task_data;
          }
        }
      }, gantt);
      return {
        addTaskLayer: function addTaskLayer(config) {
          var rangeFunction = getVisibleTaskRange;

          if (typeof config === "function") {
            config = {
              renderer: {
                render: config,
                getVisibleRange: rangeFunction
              }
            };
          } else {
            if (config.renderer && !config.renderer.getVisibleRange) {
              config.renderer.getVisibleRange = rangeFunction;
            }
          }

          config.view = "timeline";
          return taskLayers.addLayer(config);
        },
        _getTaskLayers: function _getTaskLayers() {
          return taskLayers.getLayers();
        },
        removeTaskLayer: function removeTaskLayer(id) {
          taskLayers.removeLayer(id);
        },
        _clearTaskLayers: function _clearTaskLayers() {
          taskLayers.clear();
        },
        addLinkLayer: function addLinkLayer(config) {
          var rangeFunction = getVisibleLinksRangeFactory();

          if (typeof config === "function") {
            config = {
              renderer: {
                render: config,
                getVisibleRange: rangeFunction
              }
            };
          } else {
            if (config.renderer && !config.renderer.getVisibleRange) {
              config.renderer.getVisibleRange = rangeFunction;
            }
          }

          config.view = "timeline";

          if (config && config.renderer) {
            if (!config.renderer.getRectangle && !config.renderer.isInViewPort) {
              config.renderer.isInViewPort = isLinkInViewport;
            }
          }

          return linkLayers.addLayer(config);
        },
        _getLinkLayers: function _getLinkLayers() {
          return linkLayers.getLayers();
        },
        removeLinkLayer: function removeLinkLayer(id) {
          linkLayers.removeLayer(id);
        },
        _clearLinkLayers: function _clearLinkLayers() {
          linkLayers.clear();
        }
      };
    }
  };
};

module.exports = createLayerEngine;