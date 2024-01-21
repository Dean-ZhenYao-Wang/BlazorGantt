var genericViewPortChecker = require("./viewport/is_in_viewport");

var isLegacyRender = require("./is_legacy_smart_render");

var basicGetRectangle = require("./viewport/get_grid_row_rectangle");

var basicGetRange = require("./viewport/get_visible_bars_range");

var rendererFactory = function rendererFactory(gantt) {
  //hash of dom elements is needed to redraw single bar/link
  var task_area_pulls = {},
      task_area_renderers = {};

  function getView(layer) {
    var view = null;

    if (typeof layer.view === "string") {
      view = gantt.$ui.getView(layer.view);
    } else if (layer.view) {
      view = layer.view;
    }

    return view;
  }

  function getRenderer(id, layer, node) {
    if (task_area_renderers[id]) return task_area_renderers[id];
    if (!layer.renderer) gantt.assert(false, "Invalid renderer call");
    var renderMethod = null;
    var updateMethod = null;
    var getRectangle = null;
    var renderCallbackMethod = null;
    var specializedViewPortChecker = null;

    if (typeof layer.renderer === "function") {
      renderMethod = layer.renderer;
      getRectangle = basicGetRectangle;
    } else {
      renderMethod = layer.renderer.render;
      updateMethod = layer.renderer.update;
      renderCallbackMethod = layer.renderer.onrender;

      if (layer.renderer.isInViewPort) {
        specializedViewPortChecker = layer.renderer.isInViewPort;
      } else {
        getRectangle = layer.renderer.getRectangle;
      }

      if (!getRectangle && getRectangle !== null) {
        getRectangle = basicGetRectangle;
      }
    }

    var filter = layer.filter;
    if (node) node.setAttribute(gantt.config.layer_attribute, true);
    task_area_renderers[id] = {
      render_item: function render_item(item, container, viewPort, layerView, viewConfig) {
        container = container || node;

        if (filter) {
          if (!filter(item)) {
            this.remove_item(item.id);
            return;
          }
        }

        var view = layerView || getView(layer);
        var config = viewConfig || (view ? view.$getConfig() : null);
        var rendererViewPort = viewPort;

        if (!rendererViewPort && config && config.smart_rendering) {
          rendererViewPort = view.getViewPort();
        }

        var dom = null;

        if (!isLegacyRender(gantt) && (getRectangle || specializedViewPortChecker) && rendererViewPort) {
          var isVisible = false;

          if (specializedViewPortChecker) {
            isVisible = specializedViewPortChecker(item, rendererViewPort, view, config, gantt);
          } else {
            isVisible = genericViewPortChecker(rendererViewPort, getRectangle(item, view, config, gantt));
          }

          if (isVisible) {
            dom = renderMethod.call(gantt, item, view, config, rendererViewPort);
          }
        } else {
          dom = renderMethod.call(gantt, item, view, config, rendererViewPort);
        }

        this.append(item, dom, container);
        var useBuffer = container.nodeType == 11; //DocumentFragment

        if (renderCallbackMethod && !useBuffer && dom) {
          renderCallbackMethod.call(gantt, item, dom, view);
        }
      },
      clear: function clear(container) {
        this.rendered = task_area_pulls[id] = {};
        if (!layer.append) this.clear_container(container);
      },
      clear_container: function clear_container(container) {
        container = container || node;

        if (container) {
          container.innerHTML = "";
        }
      },
      get_visible_range: function get_visible_range(datastore) {
        var view = getView(layer);
        var viewport;
        var viewConfig = view ? view.$getConfig() : null;

        if (viewConfig && viewConfig.smart_rendering) {
          viewport = view.getViewPort();
        }

        var range;

        if (view && viewport) {
          if (typeof layer.renderer === "function") {
            range = basicGetRange(gantt, view, viewConfig, datastore, viewport);
          } else if (layer.renderer && layer.renderer.getVisibleRange) {
            range = layer.renderer.getVisibleRange(gantt, view, viewConfig, datastore, viewport);
          }
        }

        if (!range) {
          range = {
            start: 0,
            end: datastore.count()
          };
        }

        return range;
      },
      prepare_data: function prepare_data(items) {
        if (layer.renderer && layer.renderer.prepareData) {
          return layer.renderer.prepareData(items, gantt, layer);
        }
      },
      render_items: function render_items(items, container) {
        container = container || node;
        var buffer = document.createDocumentFragment();
        this.clear(container);
        var viewPort = null;
        var view = getView(layer);
        var viewConfig = view ? view.$getConfig() : null;

        if (viewConfig && viewConfig.smart_rendering) {
          viewPort = view.getViewPort();
        }

        for (var i = 0, vis = items.length; i < vis; i++) {
          this.render_item(items[i], buffer, viewPort, view, viewConfig);
        }

        container.appendChild(buffer, container);
        var itemsSearch = {};
        items.forEach(function (item) {
          itemsSearch[item.id] = item;
        });
        var renderedItems = {};

        if (renderCallbackMethod) {
          var newElements = {};

          for (var i in this.rendered) {
            if (!renderedItems[i]) {
              newElements[i] = this.rendered[i];
              renderCallbackMethod.call(gantt, itemsSearch[i], this.rendered[i], view);
            }
          }
        }
      },
      update_items: function update_items(items, container) {
        var view = getView(layer);
        var viewConfig = view ? view.$getConfig() : null;

        if (!view || !view.$getConfig().smart_rendering || isLegacyRender(gantt)) {
          return;
        }

        if (!this.rendered) {
          return;
        }

        if (!(getRectangle || specializedViewPortChecker)) {
          return;
        }

        container = container || node;
        var buffer = document.createDocumentFragment();
        var viewPort = null;

        if (view) {
          viewPort = view.getViewPort();
        }

        var itemsSearch = {};
        items.forEach(function (item) {
          itemsSearch[item.id] = item;
        });
        var renderedItems = {};
        var nodesToRemove = {};

        for (var i in this.rendered) {
          nodesToRemove[i] = true;
          renderedItems[i] = true;
        }

        var renderCalledFor = {};

        for (var i = 0, vis = items.length; i < vis; i++) {
          var item = items[i];
          var itemNode = this.rendered[item.id];
          nodesToRemove[item.id] = false;

          if (itemNode && itemNode.parentNode) {
            var isVisible = false;

            if (specializedViewPortChecker) {
              isVisible = specializedViewPortChecker(item, viewPort, view, viewConfig, gantt);
            } else {
              isVisible = genericViewPortChecker(viewPort, getRectangle(item, view, viewConfig, gantt));
            }

            if (!isVisible) {
              nodesToRemove[item.id] = true;
            } else {
              if (updateMethod) {
                updateMethod.call(gantt, item, itemNode, view, viewConfig, viewPort);
              }

              this.restore(item, buffer);
            }
          } else {
            renderCalledFor[items[i].id] = true;
            this.render_item(items[i], buffer, viewPort, view, viewConfig);
          }
        }

        for (var i in nodesToRemove) {
          if (nodesToRemove[i]) {
            this.hide(i);
          }
        }

        if (buffer.childNodes.length) {
          container.appendChild(buffer, container);
        }

        if (renderCallbackMethod) {
          var newElements = {};

          for (var i in this.rendered) {
            if (!renderedItems[i] || renderCalledFor[i]) {
              newElements[i] = this.rendered[i];
              renderCallbackMethod.call(gantt, itemsSearch[i], this.rendered[i], view);
            }
          }
        }
      },
      append: function append(item, node, container) {
        if (!this.rendered) {
          return;
        }

        if (!node) {
          if (this.rendered[item.id]) {
            this.remove_item(item.id);
          }

          return;
        }

        if (this.rendered[item.id] && this.rendered[item.id].parentNode) {
          this.replace_item(item.id, node);
        } else {
          container.appendChild(node);
        }

        this.rendered[item.id] = node;
      },
      replace_item: function replace_item(item_id, newNode) {
        var item = this.rendered[item_id];

        if (item && item.parentNode) {
          item.parentNode.replaceChild(newNode, item);
        }

        this.rendered[item_id] = newNode;
      },
      remove_item: function remove_item(item_id) {
        this.hide(item_id);
        delete this.rendered[item_id];
      },
      hide: function hide(item_id) {
        var item = this.rendered[item_id];

        if (item && item.parentNode) {
          item.parentNode.removeChild(item);
        }
      },
      restore: function restore(item, container) {
        var dom = this.rendered[item.id];

        if (dom) {
          if (!dom.parentNode) {
            this.append(item, dom, container || node);
          }
        } else {
          this.render_item(item, container || node);
        }
      },
      change_id: function change_id(oldid, newid) {
        this.rendered[newid] = this.rendered[oldid];
        delete this.rendered[oldid];
      },
      rendered: task_area_pulls[id],
      node: node,
      destructor: function destructor() {
        this.clear();
        delete task_area_renderers[id];
        delete task_area_pulls[id];
      }
    };
    return task_area_renderers[id];
  }

  function clearRenderers() {
    for (var i in task_area_renderers) {
      getRenderer(i).destructor();
    }
  }

  return {
    getRenderer: getRenderer,
    clearRenderers: clearRenderers
  };
};

module.exports = rendererFactory;