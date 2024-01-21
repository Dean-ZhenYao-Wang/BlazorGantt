var renderFactoryProvider = require("./render_factory");

var utils = require("../../../utils/utils"),
    domHelpers = require("../utils/dom_helpers"),
    isLegacyRender = require("./is_legacy_smart_render");

var layerFactory = function layerFactory(gantt) {
  var renderFactory = renderFactoryProvider(gantt);
  return {
    createGroup: function createGroup(getContainer, relativeRoot, defaultFilters, initLayer) {
      var renderGroup = {
        tempCollection: [],
        renderers: {},
        container: getContainer,
        filters: [],
        getLayers: function getLayers() {
          this._add(); // add pending layers


          var res = [];

          for (var i in this.renderers) {
            res.push(this.renderers[i]);
          }

          return res;
        },
        getLayer: function getLayer(id) {
          return this.renderers[id];
        },
        _add: function _add(layer) {
          if (layer) {
            layer.id = layer.id || utils.uid();
            this.tempCollection.push(layer);
          }

          var container = this.container();
          var pending = this.tempCollection;

          for (var i = 0; i < pending.length; i++) {
            layer = pending[i];
            if (!this.container() && !(layer && layer.container && domHelpers.isChildOf(layer.container, document.body))) continue;
            var node = layer.container,
                id = layer.id,
                topmost = layer.topmost;

            if (!node.parentNode) {
              //insert on top or below the tasks
              if (topmost) {
                container.appendChild(node);
              } else {
                var rel = relativeRoot ? relativeRoot() : container.firstChild; // GS-1274: if we don't add the second check, Gantt stops working if
                // we add the task layer without the timeline and switch to a layout with the timeline

                if (rel && rel.parentNode == container) container.insertBefore(node, rel);else container.appendChild(node);
              }
            }

            this.renderers[id] = renderFactory.getRenderer(id, layer, node);

            if (initLayer) {
              initLayer(layer, gantt);
            }

            this.tempCollection.splice(i, 1);
            i--;
          }
        },
        addLayer: function addLayer(config) {
          if (config) {
            if (typeof config == "function") {
              config = {
                renderer: config
              };
            }

            if (config.filter === undefined) {
              config.filter = mergeFilters(defaultFilters || []);
            } else if (config.filter instanceof Array) {
              config.filter.push(defaultFilters);
              config.filter = mergeFilters(config.filter);
            }

            if (!config.container) {
              config.container = document.createElement("div");
            }

            var self = this;

            config.requestUpdate = function () {
              if (gantt.config.smart_rendering && !isLegacyRender(gantt)) {
                if (self.renderers[config.id]) {
                  self.onUpdateRequest(self.renderers[config.id]);
                }
              }
            };
          }

          this._add(config);

          return config ? config.id : undefined;
        },
        onUpdateRequest: function onUpdateRequest(layer) {},
        eachLayer: function eachLayer(code) {
          for (var i in this.renderers) {
            code(this.renderers[i]);
          }
        },
        removeLayer: function removeLayer(id) {
          if (!this.renderers[id]) return;
          this.renderers[id].destructor();
          delete this.renderers[id];
        },
        clear: function clear() {
          for (var i in this.renderers) {
            this.renderers[i].destructor();
          }

          this.renderers = {};
        } //,
        //prepareConfig: prepareConfig

      };
      gantt.attachEvent("onDestroy", function () {
        renderGroup.clear();
        renderGroup = null;
      });
      return renderGroup;
    }
  };
};

function mergeFilters(filter_methods) {
  if (!(filter_methods instanceof Array)) {
    filter_methods = Array.prototype.slice.call(arguments, 0);
  }

  return function (obj) {
    var res = true;

    for (var i = 0, len = filter_methods.length; i < len; i++) {
      var filter_method = filter_methods[i];

      if (filter_method) {
        res = res && filter_method(obj.id, obj) !== false;
      }
    }

    return res;
  };
}

module.exports = layerFactory;