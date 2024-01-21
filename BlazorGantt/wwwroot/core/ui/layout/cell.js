var utils = require("../../../utils/utils"),
    eventable = require("../../../utils/eventable"),
    domHelpers = require("../utils/dom_helpers");

var Cell = function () {
  "use strict";

  function Cell(parent, config, factory, gantt) {
    if (parent) {
      this.$container = domHelpers.toNode(parent);
      this.$parent = parent;
    } // save config


    this.$config = utils.mixin(config, {
      headerHeight: 33
    });
    this.$gantt = gantt;
    this.$domEvents = gantt._createDomEventScope(); // set id

    this.$id = config.id || "c" + utils.uid();
    this.$name = "cell";
    this.$factory = factory;
    eventable(this);
  }

  Cell.prototype.destructor = function () {
    this.$parent = this.$container = this.$view = null;
    var mouse = this.$gantt.$services.getService("mouseEvents");
    mouse.detach("click", "gantt_header_arrow", this._headerClickHandler);
    this.$domEvents.detachAll();
    this.callEvent("onDestroy", []);
    this.detachAllEvents();
  };

  Cell.prototype.cell = function (id) {
    return null;
  };

  Cell.prototype.scrollTo = function (left, top) {
    //GS-333 Add a way to scroll the HTML views:
    var cell = this.$view;
    if (this.$config.html) cell = this.$view.firstChild;

    if (left * 1 == left) {
      cell.scrollLeft = left;
    }

    if (top * 1 == top) {
      cell.scrollTop = top;
    }
  };

  Cell.prototype.clear = function () {
    this.getNode().innerHTML = "";
    this.getNode().className = "gantt_layout_content";
    this.getNode().style.padding = "0";
  };

  Cell.prototype.resize = function (_final) {
    if (this.$parent) {
      return this.$parent.resize(_final);
    }

    if (_final === false) {
      this.$preResize = true;
    }

    var topCont = this.$container;
    var x = topCont.offsetWidth;
    var y = topCont.offsetHeight;
    var topSize = this.getSize();

    if (topCont === document.body) {
      x = document.body.offsetWidth;
      y = document.body.offsetHeight;
    }

    if (x < topSize.minWidth) {
      x = topSize.minWidth;
    }

    if (x > topSize.maxWidth) {
      x = topSize.maxWidth;
    }

    if (y < topSize.minHeight) {
      y = topSize.minHeight;
    }

    if (y > topSize.maxHeight) {
      y = topSize.maxHeight;
    }

    this.setSize(x, y);

    if (!this.$preResize) {//	self.callEvent("onResize", [x, y]);
    }

    this.$preResize = false;
  };

  Cell.prototype.hide = function () {
    this._hide(true);

    this.resize();
  };

  Cell.prototype.show = function (force) {
    this._hide(false);

    if (force && this.$parent) {
      this.$parent.show();
    }

    this.resize();
  };

  Cell.prototype._hide = function (mode) {
    if (mode === true && this.$view.parentNode) {
      this.$view.parentNode.removeChild(this.$view);
    } else if (mode === false && !this.$view.parentNode) {
      var index = this.$parent.cellIndex(this.$id);
      this.$parent.moveView(this, index);
    }

    this.$config.hidden = mode;
  };

  Cell.prototype.$toHTML = function (content, css) {
    if (content === void 0) {
      content = "";
    }

    css = [css || "", this.$config.css || ""].join(" ");
    var obj = this.$config;
    var header = "";

    if (obj.raw) {
      content = typeof obj.raw === "string" ? obj.raw : "";
    } else {
      if (!content) {
        content = "<div class='gantt_layout_content' " + (css ? " class='" + css + "' " : "") + " >" + (obj.html || "") + "</div>";
      }

      if (obj.header) {
        var collapseIcon = obj.canCollapse ? "<div class='gantt_layout_header_arrow'></div>" : "";
        header = "<div class='gantt_layout_header'>" + collapseIcon + "<div class='gantt_layout_header_content'>" + obj.header + "</div></div>";
      }
    }

    return "<div class='gantt_layout_cell " + css + "' data-cell-id='" + this.$id + "'>" + header + content + "</div>";
  };

  Cell.prototype.$fill = function (node, parent) {
    this.$view = node;
    this.$parent = parent;
    this.init();
  };

  Cell.prototype.getNode = function () {
    return this.$view.querySelector("gantt_layout_cell") || this.$view;
  };

  Cell.prototype.init = function () {
    // [NOT-GOOD] code is executed for each component, while it still has only one handler, it is no good
    var self = this;

    this._headerClickHandler = function (e) {
      var cellId = domHelpers.locateAttribute(e, "data-cell-id");

      if (cellId == self.$id) {
        self.toggle();
      }
    };

    var mouse = this.$gantt.$services.getService("mouseEvents");
    mouse.delegate("click", "gantt_header_arrow", this._headerClickHandler);
    this.callEvent("onReady", []);
  };

  Cell.prototype.toggle = function () {
    this.$config.collapsed = !this.$config.collapsed;
    this.resize();
  };

  Cell.prototype.getSize = function () {
    var size = {
      height: this.$config.height || 0,
      width: this.$config.width || 0,
      gravity: this.$config.gravity || 1,
      minHeight: this.$config.minHeight || 0,
      minWidth: this.$config.minWidth || 0,
      maxHeight: this.$config.maxHeight || 100000000000,
      maxWidth: this.$config.maxWidth || 100000000000
    };

    if (this.$config.collapsed) {
      var mode = this.$config.mode === "x";
      size[mode ? "width" : "height"] = size[mode ? "maxWidth" : "maxHeight"] = this.$config.headerHeight;
    }

    return size;
  };

  Cell.prototype.getContentSize = function () {
    var width = this.$lastSize.contentX;

    if (width !== width * 1) {
      width = this.$lastSize.width;
    }

    var height = this.$lastSize.contentY;

    if (height !== height * 1) {
      height = this.$lastSize.height;
    }

    return {
      width: width,
      height: height
    };
  };

  Cell.prototype._getBorderSizes = function () {
    var borders = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      horizontal: 0,
      vertical: 0
    };

    if (this._currentBorders) {
      if (this._currentBorders[this._borders.left]) {
        borders.left = 1;
        borders.horizontal++;
      }

      if (this._currentBorders[this._borders.right]) {
        borders.right = 1;
        borders.horizontal++;
      }

      if (this._currentBorders[this._borders.top]) {
        borders.top = 1;
        borders.vertical++;
      }

      if (this._currentBorders[this._borders.bottom]) {
        borders.bottom = 1;
        borders.vertical++;
      }
    }

    return borders;
  };

  Cell.prototype.setSize = function (x, y) {
    this.$view.style.width = x + "px";
    this.$view.style.height = y + "px";

    var borders = this._getBorderSizes();

    var contentY = y - borders.vertical;
    var contentX = x - borders.horizontal;
    this.$lastSize = {
      x: x,
      y: y,
      contentX: contentX,
      contentY: contentY
    };

    if (this.$config.header) {
      this._sizeHeader();
    } else {
      this._sizeContent();
    }
  };

  Cell.prototype._borders = {
    "left": "gantt_layout_cell_border_left",
    "right": "gantt_layout_cell_border_right",
    "top": "gantt_layout_cell_border_top",
    "bottom": "gantt_layout_cell_border_bottom"
  };

  Cell.prototype._setBorders = function (css, view) {
    if (!view) {
      view = this;
    }

    var node = view.$view;

    for (var i in this._borders) {
      domHelpers.removeClassName(node, this._borders[i]);
    }

    if (typeof css == "string") {
      css = [css];
    }

    var cssHash = {};

    for (var i = 0; i < css.length; i++) {
      domHelpers.addClassName(node, css[i]);
      cssHash[css[i]] = true;
    }

    view._currentBorders = cssHash;
  };

  Cell.prototype._sizeContent = function () {
    var content = this.$view.childNodes[0];

    if (content && content.className == "gantt_layout_content") {
      content.style.height = this.$lastSize.contentY + "px";
    }
  };

  Cell.prototype._sizeHeader = function () {
    var size = this.$lastSize;
    size.contentY -= this.$config.headerHeight;
    var header = this.$view.childNodes[0];
    var content = this.$view.childNodes[1];
    var xLayout = this.$config.mode === "x";

    if (this.$config.collapsed) {
      content.style.display = "none";

      if (xLayout) {
        header.className = "gantt_layout_header collapsed_x";
        header.style.width = size.y + "px";
        var d = Math.floor(size.y / 2 - size.x / 2);
        header.style.transform = "rotate(90deg) translate(" + d + "px, " + d + "px)";
        content.style.display = "none";
      } else {
        header.className = "gantt_layout_header collapsed_y";
      }
    } else {
      if (xLayout) {
        header.className = "gantt_layout_header";
      } else {
        header.className = "gantt_layout_header vertical";
      }

      header.style.width = 'auto';
      header.style.transform = '';
      content.style.display = "";
      content.style.height = size.contentY + "px";
    }

    header.style.height = this.$config.headerHeight + "px";
  };

  return Cell;
}();

module.exports = Cell;