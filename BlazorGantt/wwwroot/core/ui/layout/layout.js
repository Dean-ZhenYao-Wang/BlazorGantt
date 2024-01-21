var __extends = require("../../../utils/extends"),
    domHelpers = require("../utils/dom_helpers"),
    Cell = require("./cell");

var Layout = function (_super) {
  "use strict";

  __extends(Layout, _super);

  function Layout(parent, config, factory) {
    var _this = _super.apply(this, arguments) || this;

    if (parent) _this.$root = true;

    _this._parseConfig(config);

    _this.$name = "layout";
    return _this;
  }

  Layout.prototype.destructor = function () {
    if (this.$container && this.$view) {
      domHelpers.removeNode(this.$view);
    }

    for (var i = 0; i < this.$cells.length; i++) {
      var child = this.$cells[i];
      child.destructor();
    }

    this.$cells = [];

    _super.prototype.destructor.call(this);
  };

  Layout.prototype._resizeScrollbars = function (autosize, scrollbars) {
    var scrollChanged = false;
    var visibleScrollbars = [],
        hiddenScrollbars = [];
    var scrollbarsToHide = [];

    function showScrollbar(scrollbar) {
      scrollbar.$parent.show();
      scrollChanged = true;
      visibleScrollbars.push(scrollbar);
    }

    function hideScrollbar(scrollbar) {
      scrollbar.$parent.hide();
      scrollChanged = true;
      hiddenScrollbars.push(scrollbar);
    }

    var scrollbar;

    for (var i = 0; i < scrollbars.length; i++) {
      scrollbar = scrollbars[i];

      if (autosize[scrollbar.$config.scroll]) {
        hideScrollbar(scrollbar);
      } else if (scrollbar.shouldHide()) {
        //hideScrollbar(scrollbar);
        scrollbarsToHide.push(scrollbar);
      } else if (scrollbar.shouldShow()) {
        showScrollbar(scrollbar);
      } else {
        if (scrollbar.isVisible()) {
          visibleScrollbars.push(scrollbar);
        } else {
          hiddenScrollbars.push(scrollbar);
        }
      }
    }

    var visibleGroups = {};

    for (var i = 0; i < visibleScrollbars.length; i++) {
      if (visibleScrollbars[i].$config.group) {
        visibleGroups[visibleScrollbars[i].$config.group] = true;
      }
    } // GS-2220


    scrollbarsToHide.forEach(function (scrollbar) {
      if (!(scrollbar.$config.group && visibleGroups[scrollbar.$config.group])) {
        hideScrollbar(scrollbar);
      }
    });

    for (var i = 0; i < hiddenScrollbars.length; i++) {
      scrollbar = hiddenScrollbars[i];

      if (scrollbar.$config.group && visibleGroups[scrollbar.$config.group]) {
        showScrollbar(scrollbar); // GS-707 If the scrollbar was hidden then showed, the container resize shouldn't happen because of that

        for (var j = 0; j < visibleScrollbars.length; j++) {
          if (visibleScrollbars[j] == scrollbar) {
            this.$gantt.$scrollbarRepaint = true;
            break;
          }
        }
      }
    }

    return scrollChanged;
  };

  Layout.prototype._syncCellSizes = function (groupName, newSize) {
    if (!groupName) return;
    var groups = {};

    this._eachChild(function (cell) {
      if (cell.$config.group && cell.$name != "scrollbar" && cell.$name != "resizer") {
        if (!groups[cell.$config.group]) {
          groups[cell.$config.group] = [];
        }

        groups[cell.$config.group].push(cell);
      }
    });

    if (groups[groupName]) {
      this._syncGroupSize(groups[groupName], newSize);
    }

    return groups[groupName];
  };

  Layout.prototype._syncGroupSize = function (cells, newSize) {
    if (!cells.length) return;
    var property = cells[0].$parent._xLayout ? "width" : "height";
    var direction = cells[0].$parent.getNextSibling(cells[0].$id) ? 1 : -1;
    var newSizeValue = newSize.value;
    var isGravity = newSize.isGravity;

    for (var i = 0; i < cells.length; i++) {
      var ownSize = cells[i].getSize();
      var resizeSibling = direction > 0 ? cells[i].$parent.getNextSibling(cells[i].$id) : cells[i].$parent.getPrevSibling(cells[i].$id);

      if (resizeSibling.$name == "resizer") {
        resizeSibling = direction > 0 ? resizeSibling.$parent.getNextSibling(resizeSibling.$id) : resizeSibling.$parent.getPrevSibling(resizeSibling.$id);
      }

      var siblingSize = resizeSibling.getSize();

      if (!isGravity) {
        if (resizeSibling[property]) {
          var totalGravity = ownSize.gravity + siblingSize.gravity;
          var totalSize = ownSize[property] + siblingSize[property];
          var k = totalGravity / totalSize;
          cells[i].$config.gravity = k * newSizeValue;
          resizeSibling.$config[property] = totalSize - newSizeValue;
          resizeSibling.$config.gravity = totalGravity - k * newSizeValue;
        } else {
          cells[i].$config[property] = newSizeValue;
        }
      } else {
        cells[i].$config.gravity = newSizeValue;
      }

      var mainGrid = this.$gantt.$ui.getView("grid");

      if (mainGrid && cells[i].$content === mainGrid && !mainGrid.$config.scrollable && !isGravity) {
        this.$gantt.config.grid_width = newSizeValue;
      }
    }
  };

  Layout.prototype.resize = function (startStage) {
    var mainCall = false;

    if (this.$root && !this._resizeInProgress) {
      this.callEvent("onBeforeResize", []);
      mainCall = true;
      this._resizeInProgress = true;
    }

    _super.prototype.resize.call(this, true);

    _super.prototype.resize.call(this, false);

    if (mainCall) {
      var contentViews = [];
      contentViews = contentViews.concat(this.getCellsByType("viewCell"));
      contentViews = contentViews.concat(this.getCellsByType("viewLayout"));
      contentViews = contentViews.concat(this.getCellsByType("hostCell"));
      var scrollbars = this.getCellsByType("scroller");

      for (var i = 0; i < contentViews.length; i++) {
        if (!contentViews[i].$config.hidden) contentViews[i].setContentSize();
      }

      var autosize = this._getAutosizeMode(this.$config.autosize);
      /* // possible to rollback set content size when autisize is disabled, not sure if need to
      		contentViews.forEach(function(view){
      			const parent = view.$parent;
      			if(!autosize.x){
      				if(parent.$config.$originalWidthStored){
      					parent.$config.$originalWidthStored = false;
      					parent.$config.width = parent.$config.$originalWidth;
      					parent.$config.$originalWidth = undefined;
      				}
      			}
      
      			if(!autosize.y){
      				if(parent.$config.$originalHeightStored){
      					parent.$config.$originalHeightStored = false;
      					parent.$config.height = parent.$config.$originalHeight;
      					parent.$config.$originalHeight = undefined;
      				}
      			}
      		});*/


      var scrollChanged = this._resizeScrollbars(autosize, scrollbars);

      if (this.$config.autosize) {
        this.autosize(this.$config.autosize);
        contentViews.forEach(function (view) {
          var parent = view.$parent;
          var sizes = parent.getContentSize(autosize);

          if (autosize.x) {
            if (!parent.$config.$originalWidthStored) {
              parent.$config.$originalWidthStored = true;
              parent.$config.$originalWidth = parent.$config.width;
            }

            parent.$config.width = sizes.width;
          }

          if (autosize.y) {
            if (!parent.$config.$originalHeightStored) {
              parent.$config.$originalHeightStored = true;
              parent.$config.$originalHeight = parent.$config.height;
            }

            parent.$config.height = sizes.height;
          }
        });
        scrollChanged = true;
      }

      if (scrollChanged) {
        this.resize();

        for (var i = 0; i < contentViews.length; i++) {
          if (!contentViews[i].$config.hidden) contentViews[i].setContentSize();
        }
      }

      this.callEvent("onResize", []);
    }

    if (mainCall) {
      this._resizeInProgress = false;
    }
  };

  Layout.prototype._eachChild = function (code, cell) {
    cell = cell || this;
    code(cell);

    if (cell.$cells) {
      for (var i = 0; i < cell.$cells.length; i++) {
        this._eachChild(code, cell.$cells[i]);
      }
    }
  };

  Layout.prototype.isChild = function (view) {
    var res = false;

    this._eachChild(function (child) {
      if (child === view || child.$content === view) {
        res = true;
      }
    });

    return res;
  };

  Layout.prototype.getCellsByType = function (type) {
    var res = [];

    if (type === this.$name) {
      res.push(this);
    }

    if (this.$content && this.$content.$name == type) {
      res.push(this.$content);
    }

    if (this.$cells) {
      for (var i = 0; i < this.$cells.length; i++) {
        var children = Layout.prototype.getCellsByType.call(this.$cells[i], type);

        if (children.length) {
          res.push.apply(res, children);
        }
      }
    }

    return res;
  };

  Layout.prototype.getNextSibling = function (cellId) {
    var index = this.cellIndex(cellId);

    if (index >= 0 && this.$cells[index + 1]) {
      return this.$cells[index + 1];
    } else {
      return null;
    }
  };

  Layout.prototype.getPrevSibling = function (cellId) {
    var index = this.cellIndex(cellId);

    if (index >= 0 && this.$cells[index - 1]) {
      return this.$cells[index - 1];
    } else {
      return null;
    }
  };

  Layout.prototype.cell = function (id) {
    for (var i = 0; i < this.$cells.length; i++) {
      var child = this.$cells[i];

      if (child.$id === id) {
        return child;
      }

      var sub = child.cell(id);

      if (sub) {
        return sub;
      }
    }
  };

  Layout.prototype.cellIndex = function (id) {
    for (var i = 0; i < this.$cells.length; i++) {
      if (this.$cells[i].$id === id) {
        return i;
      }
    }

    return -1;
  };

  Layout.prototype.moveView = function (view, ind) {
    if (this.$cells[ind] !== view) {
      return window.alert("Not implemented");
    } else {
      ind += this.$config.header ? 1 : 0;
      var node = this.$view;

      if (ind >= node.childNodes.length) {
        node.appendChild(view.$view);
      } else {
        node.insertBefore(view.$view, node.childNodes[ind]);
      }
    }
  };

  Layout.prototype._parseConfig = function (config) {
    this.$cells = [];
    this._xLayout = !config.rows;
    var cells = config.rows || config.cols || config.views;

    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      cell.mode = this._xLayout ? "x" : "y";
      var $content = this.$factory.initUI(cell, this);

      if (!$content) {
        cells.splice(i, 1);
        i--;
      } else {
        $content.$parent = this;
        this.$cells.push($content);
      }
    }
  };

  Layout.prototype.getCells = function () {
    return this.$cells;
  };

  Layout.prototype.render = function () {
    var view = domHelpers.insertNode(this.$container, this.$toHTML());
    this.$fill(view, null);
    this.callEvent("onReady", []);
    this.resize(); // do simple repaint after the first call

    this.render = this.resize;
  };

  Layout.prototype.$fill = function (node, parent) {
    this.$view = node;
    this.$parent = parent;
    var cells = domHelpers.getChildNodes(node, "gantt_layout_cell");

    for (var i = cells.length - 1; i >= 0; i--) {
      var sub = this.$cells[i];
      sub.$fill(cells[i], this); // initially hidden cell

      if (sub.$config.hidden) {
        sub.$view.parentNode.removeChild(sub.$view);
      }
    }
  };

  Layout.prototype.$toHTML = function () {
    var mode = this._xLayout ? "x" : "y";
    var html = [];

    for (var i = 0; i < this.$cells.length; i++) {
      html.push(this.$cells[i].$toHTML());
    }

    return _super.prototype.$toHTML.call(this, html.join(""), (this.$root ? "gantt_layout_root " : "") + "gantt_layout gantt_layout_" + mode);
  };

  Layout.prototype.getContentSize = function (mode) {
    var contentWidth = 0,
        contentHeight = 0;
    var cellSize, cell, borders;

    for (var i = 0; i < this.$cells.length; i++) {
      cell = this.$cells[i];
      if (cell.$config.hidden) continue;
      cellSize = cell.getContentSize(mode);

      if (cell.$config.view === "scrollbar" && mode[cell.$config.scroll]) {
        cellSize.height = 0;
        cellSize.width = 0;
      }

      if (cell.$config.resizer) {
        if (this._xLayout) {
          cellSize.height = 0;
        } else {
          cellSize.width = 0;
        }
      }

      borders = cell._getBorderSizes();

      if (this._xLayout) {
        contentWidth += cellSize.width + borders.horizontal;
        contentHeight = Math.max(contentHeight, cellSize.height + borders.vertical);
      } else {
        contentWidth = Math.max(contentWidth, cellSize.width + borders.horizontal);
        contentHeight += cellSize.height + borders.vertical;
      }
    }

    borders = this._getBorderSizes();
    contentWidth += borders.horizontal;
    contentHeight += borders.vertical; // GS-149 & GS-150: By default this code only increases the container sizes, because of that, the cell sizes
    // are also increased. Keep this code here in the case if something goes wrong

    /*
    if(this.$root){
    	contentWidth += 1;
    	contentHeight += 1;
    }
    */

    return {
      width: contentWidth,
      height: contentHeight
    };
  };

  Layout.prototype._cleanElSize = function (value) {
    return (value || "").toString().replace("px", "") * 1 || 0;
  };

  Layout.prototype._getBoxStyles = function (div) {
    var computed = null;

    if (window.getComputedStyle) {
      computed = window.getComputedStyle(div, null);
    } else {
      //IE with elem.currentStyle does not calculate sizes from %, so will use the default approach
      computed = {
        "width": div.clientWidth,
        "height": div.clientHeight
      };
    }

    var properties = ["width", "height", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth", "borderTopWidth", "borderBottomWidth"];
    var styles = {
      boxSizing: computed.boxSizing == "border-box"
    };

    if (computed.MozBoxSizing) {
      styles.boxSizing = computed.MozBoxSizing == "border-box";
    }

    for (var i = 0; i < properties.length; i++) {
      styles[properties[i]] = computed[properties[i]] ? this._cleanElSize(computed[properties[i]]) : 0;
    }

    var box = {
      horPaddings: styles.paddingLeft + styles.paddingRight + styles.borderLeftWidth + styles.borderRightWidth,
      vertPaddings: styles.paddingTop + styles.paddingBottom + styles.borderTopWidth + styles.borderBottomWidth,
      borderBox: styles.boxSizing,
      innerWidth: styles.width,
      innerHeight: styles.height,
      outerWidth: styles.width,
      outerHeight: styles.height
    };

    if (box.borderBox) {
      box.innerWidth -= box.horPaddings;
      box.innerHeight -= box.vertPaddings;
    } else {
      box.outerWidth += box.horPaddings;
      box.outerHeight += box.vertPaddings;
    }

    return box;
  };

  Layout.prototype._getAutosizeMode = function (config) {
    var res = {
      x: false,
      y: false
    };

    if (config === "xy") {
      res.x = res.y = true;
    } else if (config === "y" || config === true) {
      res.y = true;
    } else if (config === "x") {
      res.x = true;
    }

    return res;
  };

  Layout.prototype.autosize = function (mode) {
    var res = this._getAutosizeMode(mode);

    var boxSizes = this._getBoxStyles(this.$container);

    var contentSizes = this.getContentSize(mode);
    var node = this.$container;

    if (res.x) {
      if (boxSizes.borderBox) {
        contentSizes.width += boxSizes.horPaddings;
      }

      node.style.width = contentSizes.width + "px";
    }

    if (res.y) {
      if (boxSizes.borderBox) {
        contentSizes.height += boxSizes.vertPaddings;
      }

      node.style.height = contentSizes.height + "px";
    }
  };

  Layout.prototype.getSize = function () {
    this._sizes = [];
    var width = 0;
    var minWidth = 0;
    var maxWidth = 100000000000;
    var height = 0;
    var maxHeight = 100000000000;
    var minHeight = 0;

    for (var i = 0; i < this.$cells.length; i++) {
      var size = this._sizes[i] = this.$cells[i].getSize();

      if (this.$cells[i].$config.hidden) {
        continue;
      }

      if (this._xLayout) {
        if (!size.width && size.minWidth) {
          width += size.minWidth;
        } else {
          width += size.width;
        }

        maxWidth += size.maxWidth;
        minWidth += size.minWidth;
        height = Math.max(height, size.height);
        maxHeight = Math.min(maxHeight, size.maxHeight); // min of maxHeight

        minHeight = Math.max(minHeight, size.minHeight); // max of minHeight
      } else {
        if (!size.height && size.minHeight) {
          height += size.minHeight;
        } else {
          height += size.height;
        }

        maxHeight += size.maxHeight;
        minHeight += size.minHeight;
        width = Math.max(width, size.width);
        maxWidth = Math.min(maxWidth, size.maxWidth); // min of maxWidth

        minWidth = Math.max(minWidth, size.minWidth); // max of minWidth
      }
    }

    var self = _super.prototype.getSize.call(this); // maxWidth


    if (self.maxWidth >= 100000) {
      self.maxWidth = maxWidth;
    } // maxHeight


    if (self.maxHeight >= 100000) {
      self.maxHeight = maxHeight;
    } // minWidth


    self.minWidth = self.minWidth !== self.minWidth ? 0 : self.minWidth; // || self.width || Math.max(minWidth, width);
    // minHeight

    self.minHeight = self.minHeight !== self.minHeight ? 0 : self.minHeight; //self.minHeight || self.height || Math.max(minHeight, height);
    // sizes with paddings and margins

    if (this._xLayout) {
      self.minWidth += this.$config.margin * this.$cells.length || 0;
      self.minWidth += this.$config.padding * 2 || 0;
      self.minHeight += this.$config.padding * 2 || 0;
    } else {
      self.minHeight += this.$config.margin * this.$cells.length || 0;
      self.minHeight += this.$config.padding * 2 || 0;
    }

    return self;
  }; // calc total gravity and free space


  Layout.prototype._calcFreeSpace = function (s, cell, xLayout) {
    var min = xLayout ? cell.minWidth : cell.minHeight;
    var max = xLayout ? cell.maxWidth : cell.maxWidth;
    var side = s;

    if (!side) {
      side = Math.floor(this._free / this._gravity * cell.gravity);

      if (side > max) {
        side = max;
        this._free -= side;
        this._gravity -= cell.gravity;
      }

      if (side < min) {
        side = min;
        this._free -= side;
        this._gravity -= cell.gravity;
      }
    } else {
      if (side > max) {
        side = max;
      }

      if (side < min) {
        side = min;
      }

      this._free -= side;
    }

    return side;
  };

  Layout.prototype._calcSize = function (s, size, xLayout) {
    var side = s;
    var min = xLayout ? size.minWidth : size.minHeight;
    var max = xLayout ? size.maxWidth : size.maxHeight;

    if (!side) {
      side = Math.floor(this._free / this._gravity * size.gravity);
    }

    if (side > max) {
      side = max;
    }

    if (side < min) {
      side = min;
    }

    return side;
  };

  Layout.prototype._configureBorders = function () {
    if (this.$root) {
      this._setBorders([this._borders.left, this._borders.top, this._borders.right, this._borders.bottom], this);
    }

    var borderClass = this._xLayout ? this._borders.right : this._borders.bottom;
    var cells = this.$cells;
    var lastVisibleIndex = cells.length - 1;

    for (var i = lastVisibleIndex; i >= 0; i--) {
      if (!cells[i].$config.hidden) {
        lastVisibleIndex = i;
        break;
      }
    }

    for (var i = 0; i < cells.length; i++) {
      if (cells[i].$config.hidden) {
        continue;
      }

      var lastCell = i >= lastVisibleIndex;
      var borderColorClass = "";

      if (!lastCell && cells[i + 1]) {
        if (cells[i + 1].$config.view == "scrollbar") {
          if (this._xLayout) {
            lastCell = true;
          } else {
            borderColorClass = "gantt_layout_cell_border_transparent";
          }
        }
      }

      this._setBorders(lastCell ? [] : [borderClass, borderColorClass], cells[i]);
    }
  };

  Layout.prototype._updateCellVisibility = function () {
    var oldVisibleCells = this._visibleCells || {};
    var firstCall = !this._visibleCells;
    var visibleCells = {};
    var cell = null;
    var parentVisibility = [];

    for (var i = 0; i < this._sizes.length; i++) {
      cell = this.$cells[i];

      if (cell.$config.hide_empty) {
        parentVisibility.push(cell);
      }

      if (!firstCall && cell.$config.hidden && oldVisibleCells[cell.$id]) {
        cell._hide(true);
      } else if (!cell.$config.hidden && !oldVisibleCells[cell.$id]) {
        cell._hide(false);
      }

      if (!cell.$config.hidden) {
        visibleCells[cell.$id] = true;
      }
    }

    this._visibleCells = visibleCells; // GS-27. A way to hide the whole cell if all its children are hidden

    for (var i = 0; i < parentVisibility.length; i++) {
      var cell = parentVisibility[i];
      var children = cell.$cells;
      var hideCell = true;
      children.forEach(function (child) {
        if (!child.$config.hidden && !child.$config.resizer) {
          hideCell = false;
        }
      });
      cell.$config.hidden = hideCell;
    }
  };

  Layout.prototype.setSize = function (x, y) {
    this._configureBorders();

    _super.prototype.setSize.call(this, x, y);

    y = this.$lastSize.contentY;
    x = this.$lastSize.contentX;
    var padding = this.$config.padding || 0;
    this.$view.style.padding = padding + "px";
    this._gravity = 0;
    this._free = this._xLayout ? x : y;
    this._free -= padding * 2; // calc all gravity

    var cell, size;

    this._updateCellVisibility();

    for (var i = 0; i < this._sizes.length; i++) {
      cell = this.$cells[i];

      if (cell.$config.hidden) {
        continue;
      }

      var margin = this.$config.margin || 0;

      if (cell.$name == "resizer" && !margin) {
        margin = -1;
      } // set margins to child cell


      var cellView = cell.$view;
      var marginSide = this._xLayout ? "marginRight" : "marginBottom";

      if (i !== this.$cells.length - 1) {
        cellView.style[marginSide] = margin + "px";
        this._free -= margin; // calc free space without margin
      }

      size = this._sizes[i];

      if (this._xLayout) {
        if (!size.width) {
          this._gravity += size.gravity;
        }
      } else {
        if (!size.height) {
          this._gravity += size.gravity;
        }
      }
    }

    for (var i = 0; i < this._sizes.length; i++) {
      cell = this.$cells[i];

      if (cell.$config.hidden) {
        continue;
      }

      size = this._sizes[i];
      var width = size.width;
      var height = size.height;

      if (this._xLayout) {
        this._calcFreeSpace(width, size, true);
      } else {
        this._calcFreeSpace(height, size, false);
      }
    }

    for (var i = 0; i < this.$cells.length; i++) {
      cell = this.$cells[i];

      if (cell.$config.hidden) {
        continue;
      }

      size = this._sizes[i];
      var dx = void 0;
      var dy = void 0;

      if (this._xLayout) {
        dx = this._calcSize(size.width, size, true);
        dy = y - padding * 2; // layout height without paddings
      } else {
        dx = x - padding * 2; // layout width without paddings

        dy = this._calcSize(size.height, size, false);
      }

      cell.setSize(dx, dy);
    }
  };

  return Layout;
}(Cell);

module.exports = Layout;