var domHelpers = require("./utils/dom_helpers");

var initializer = function () {
  return function (gantt) {
    return {
      getVerticalScrollbar: function getVerticalScrollbar() {
        return gantt.$ui.getView("scrollVer");
      },
      getHorizontalScrollbar: function getHorizontalScrollbar() {
        return gantt.$ui.getView("scrollHor");
      },
      _legacyGridResizerClass: function _legacyGridResizerClass(layout) {
        var resizers = layout.getCellsByType("resizer");

        for (var i = 0; i < resizers.length; i++) {
          var r = resizers[i];
          var gridResizer = false;
          var prev = r.$parent.getPrevSibling(r.$id);

          if (prev && prev.$config && prev.$config.id === "grid") {
            gridResizer = true;
          } else {
            var next = r.$parent.getNextSibling(r.$id);

            if (next && next.$config && next.$config.id === "grid") {
              gridResizer = true;
            }
          }

          if (gridResizer) {
            r.$config.css = (r.$config.css ? r.$config.css + " " : "") + "gantt_grid_resize_wrap";
          }
        }
      },
      onCreated: function onCreated(layout) {
        var first = true;

        this._legacyGridResizerClass(layout);

        layout.attachEvent("onBeforeResize", function () {
          var mainTimeline = gantt.$ui.getView("timeline");
          if (mainTimeline) mainTimeline.$config.hidden = mainTimeline.$parent.$config.hidden = !gantt.config.show_chart;
          var mainGrid = gantt.$ui.getView("grid");
          if (!mainGrid) return;

          var colsWidth = mainGrid._getColsTotalWidth();

          var hideGrid = !gantt.config.show_grid || !gantt.config.grid_width || colsWidth === 0;

          if (first && !hideGrid && colsWidth !== false) {
            gantt.config.grid_width = colsWidth;
          }

          mainGrid.$config.hidden = mainGrid.$parent.$config.hidden = hideGrid;

          if (!mainGrid.$config.hidden) {
            /* restrict grid width due to min_width, max_width, min_grid_column_width */
            var grid_limits = mainGrid._getGridWidthLimits();

            if (grid_limits[0] && gantt.config.grid_width < grid_limits[0]) gantt.config.grid_width = grid_limits[0];
            if (grid_limits[1] && gantt.config.grid_width > grid_limits[1]) gantt.config.grid_width = grid_limits[1];

            if (mainTimeline && gantt.config.show_chart) {
              mainGrid.$config.width = gantt.config.grid_width - 1; // GS-1314: Don't let the non-scrollable grid to be larger than the container with the correct width

              if (!mainGrid.$config.scrollable && mainGrid.$config.scrollY && gantt.$root.offsetWidth) {
                var ganttContainerWidth = mainGrid.$gantt.$layout.$container.offsetWidth;
                var verticalScrollbar = gantt.$ui.getView(mainGrid.$config.scrollY);
                var verticalScrollbarWidth = verticalScrollbar.$config.width;
                var gridOverflow = ganttContainerWidth - (mainGrid.$config.width + verticalScrollbarWidth);

                if (gridOverflow < 0) {
                  mainGrid.$config.width += gridOverflow;
                  gantt.config.grid_width += gridOverflow;
                }
              }

              if (!first) {
                if (mainTimeline && !domHelpers.isChildOf(mainTimeline.$task, layout.$view)) {
                  // timeline is being displayed after being not visible, reset grid with from full screen
                  if (!mainGrid.$config.original_grid_width) {
                    var skinSettings = gantt.skins[gantt.skin];

                    if (skinSettings && skinSettings.config && skinSettings.config.grid_width) {
                      mainGrid.$config.original_grid_width = skinSettings.config.grid_width;
                    } else {
                      mainGrid.$config.original_grid_width = 0;
                    }
                  }

                  gantt.config.grid_width = mainGrid.$config.original_grid_width;
                  mainGrid.$parent.$config.width = gantt.config.grid_width;
                } else {
                  mainGrid.$parent._setContentSize(mainGrid.$config.width, null);

                  gantt.$layout._syncCellSizes(mainGrid.$parent.$config.group, {
                    value: gantt.config.grid_width,
                    isGravity: false
                  });
                }
              } else {
                mainGrid.$parent.$config.width = gantt.config.grid_width;

                if (mainGrid.$parent.$config.group) {
                  gantt.$layout._syncCellSizes(mainGrid.$parent.$config.group, {
                    value: mainGrid.$parent.$config.width,
                    isGravity: false
                  });
                }
              }
            } else {
              if (mainTimeline && domHelpers.isChildOf(mainTimeline.$task, layout.$view)) {
                // hiding timeline, remember grid with to restore it when timeline is displayed again
                mainGrid.$config.original_grid_width = gantt.config.grid_width;
              }

              if (!first) {
                mainGrid.$parent.$config.width = 0;
              }
            }
          }

          first = false;
        });

        this._initScrollStateEvents(layout);
      },
      _initScrollStateEvents: function _initScrollStateEvents(layout) {
        gantt._getVerticalScrollbar = this.getVerticalScrollbar;
        gantt._getHorizontalScrollbar = this.getHorizontalScrollbar;
        var vertical = this.getVerticalScrollbar();
        var horizontal = this.getHorizontalScrollbar();

        if (vertical) {
          vertical.attachEvent("onScroll", function (oldPos, newPos, dir) {
            var scrollState = gantt.getScrollState();
            gantt.callEvent("onGanttScroll", [scrollState.x, oldPos, scrollState.x, newPos]);
          });
        }

        if (horizontal) {
          horizontal.attachEvent("onScroll", function (oldPos, newPos, dir) {
            var scrollState = gantt.getScrollState();
            gantt.callEvent("onGanttScroll", [oldPos, scrollState.y, newPos, scrollState.y]); // if the grid doesn't fit the width, scroll the row container

            var grid = gantt.$ui.getView("grid");

            if (grid && grid.$grid_data && !grid.$config.scrollable) {
              grid.$grid_data.style.left = grid.$grid.scrollLeft + "px";
              grid.$grid_data.scrollLeft = grid.$grid.scrollLeft;
            }
          });
        }

        layout.attachEvent("onResize", function () {
          if (vertical && !gantt.$scroll_ver) {
            gantt.$scroll_ver = vertical.$scroll_ver;
          }

          if (horizontal && !gantt.$scroll_hor) {
            gantt.$scroll_hor = horizontal.$scroll_hor;
          }
        });
      },
      _findGridResizer: function _findGridResizer(layout, grid) {
        var resizers = layout.getCellsByType("resizer");
        var gridFirst = true;
        var gridResizer;

        for (var i = 0; i < resizers.length; i++) {
          var res = resizers[i];

          res._getSiblings();

          var prev = res._behind;
          var next = res._front;

          if (prev && prev.$content === grid || prev.isChild && prev.isChild(grid)) {
            gridResizer = res;
            gridFirst = true;
            break;
          } else if (next && next.$content === grid || next.isChild && next.isChild(grid)) {
            gridResizer = res;
            gridFirst = false;
            break;
          }
        }

        return {
          resizer: gridResizer,
          gridFirst: gridFirst
        };
      },
      onInitialized: function onInitialized(layout) {
        var grid = gantt.$ui.getView("grid");

        var resizeInfo = this._findGridResizer(layout, grid); // expose grid resize events


        if (resizeInfo.resizer) {
          var gridFirst = resizeInfo.gridFirst,
              next = resizeInfo.resizer;

          if (next.$config.mode !== "x") {
            return; // track only horizontal resize
          }

          var initialWidth;
          next.attachEvent("onResizeStart", function (prevCellWidth, nextCellWidth) {
            var grid = gantt.$ui.getView("grid");
            var viewCell = grid ? grid.$parent : null;

            if (viewCell) {
              var limits = grid._getGridWidthLimits(); // min grid width is defined by min widths of its columns, unless grid has horizontal scroll


              if (!grid.$config.scrollable) viewCell.$config.minWidth = limits[0];
              viewCell.$config.maxWidth = limits[1];
            }

            initialWidth = gridFirst ? prevCellWidth : nextCellWidth;
            return gantt.callEvent("onGridResizeStart", [initialWidth]);
          });
          next.attachEvent("onResize", function (newBehindSize, newFrontSize) {
            var newSize = gridFirst ? newBehindSize : newFrontSize;
            return gantt.callEvent("onGridResize", [initialWidth, newSize]);
          });
          next.attachEvent("onResizeEnd", function (oldBackSize, oldFrontSize, newBackSize, newFrontSize) {
            var oldSize = gridFirst ? oldBackSize : oldFrontSize;
            var newSize = gridFirst ? newBackSize : newFrontSize;
            var grid = gantt.$ui.getView("grid");
            var viewCell = grid ? grid.$parent : null;

            if (viewCell) {
              viewCell.$config.minWidth = undefined;
            }

            var res = gantt.callEvent("onGridResizeEnd", [oldSize, newSize]);

            if (res && newSize !== 0) {
              // new size may be numeric zero when cell size is defined by 'gravity', actual size will be calculated by layout later
              gantt.config.grid_width = newSize;
            }

            return res;
          });
        }
      },
      onDestroyed: function onDestroyed(timeline) {}
    };
  };
}();

module.exports = initializer;