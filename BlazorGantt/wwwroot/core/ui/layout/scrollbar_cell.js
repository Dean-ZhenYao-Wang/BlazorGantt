var __extends = require("../../../utils/extends"),
    domHelpers = require("../utils/dom_helpers"),
    utils = require("../../../utils/utils"),
    env = require("../../../utils/env"),
    Cell = require("./cell");

var ScrollbarCell = function (_super) {
  "use strict";

  var SCROLL_MODIFIER_KEYS = ["altKey", "shiftKey", "metaKey"]; // it's no way to disable ctrl+wheel

  __extends(ScrollbarCell, _super);

  function ScrollbarCell(parent, config, factory, gantt) {
    var _this = _super.apply(this, arguments) || this;

    this.$config = utils.mixin(config, {
      scroll: "x"
    });
    _this._scrollHorizontalHandler = utils.bind(_this._scrollHorizontalHandler, _this);
    _this._scrollVerticalHandler = utils.bind(_this._scrollVerticalHandler, _this);
    _this._outerScrollVerticalHandler = utils.bind(_this._outerScrollVerticalHandler, _this);
    _this._outerScrollHorizontalHandler = utils.bind(_this._outerScrollHorizontalHandler, _this);
    _this._mouseWheelHandler = utils.bind(_this._mouseWheelHandler, _this);
    this.$config.hidden = true;
    var size = gantt.config.scroll_size;

    if (gantt.env.isIE) {
      // full element height/width must be bigger than just a browser scrollbar,
      // otherwise the scrollbar element won't be scrolled on click
      size += 1;
    }

    if (this._isHorizontal()) {
      _this.$config.height = size;
      _this.$parent.$config.height = size;
    } else {
      _this.$config.width = size;
      _this.$parent.$config.width = size;
    }

    this.$config.scrollPosition = 0;
    _this.$name = "scroller";
    return _this;
  }

  ScrollbarCell.prototype.init = function (container) {
    container.innerHTML = this.$toHTML();
    this.$view = container.firstChild;

    if (!this.$view) {
      this.init();
    }

    if (this._isVertical()) {
      this._initVertical();
    } else {
      this._initHorizontal();
    }

    this._initMouseWheel();

    this._initLinkedViews();
  };

  ScrollbarCell.prototype.$toHTML = function () {
    var className = this._isHorizontal() ? "gantt_hor_scroll" : "gantt_ver_scroll";
    return "<div class='gantt_layout_cell " + className + "'><div style='" + (this._isHorizontal() ? "width:2000px" : "height:2000px") + "'></div></div>";
  };

  ScrollbarCell.prototype._getRootParent = function () {
    var parent = this.$parent;

    while (parent && parent.$parent) {
      parent = parent.$parent;
    }

    if (parent) {
      return parent;
    }
  };

  function eachCell(root, res) {
    res.push(root);

    if (root.$cells) {
      for (var i = 0; i < root.$cells.length; i++) {
        eachCell(root.$cells[i], res);
      }
    }
  }

  ScrollbarCell.prototype._eachView = function () {
    var res = [];
    eachCell(this._getRootParent(), res);
    return res;
  };

  ScrollbarCell.prototype._getLinkedViews = function () {
    var views = this._eachView();

    var res = [];

    for (var i = 0; i < views.length; i++) {
      if (views[i].$config && (this._isVertical() && views[i].$config.scrollY == this.$id || this._isHorizontal() && views[i].$config.scrollX == this.$id)) {
        res.push(views[i]);
      }
    }

    return res;
  };

  ScrollbarCell.prototype._initHorizontal = function () {
    this.$scroll_hor = this.$view;
    this.$domEvents.attach(this.$view, "scroll", this._scrollHorizontalHandler);
  };

  ScrollbarCell.prototype._initLinkedViews = function () {
    var views = this._getLinkedViews();

    var css = this._isVertical() ? "gantt_layout_outer_scroll gantt_layout_outer_scroll_vertical" : "gantt_layout_outer_scroll gantt_layout_outer_scroll_horizontal";

    for (var i = 0; i < views.length; i++) {
      //views[i].$config.css = [views[i].$config.css || "", css].join(" ");
      domHelpers.addClassName(views[i].$view || views[i].getNode(), css);
    }
  };

  ScrollbarCell.prototype._initVertical = function () {
    this.$scroll_ver = this.$view;
    this.$domEvents.attach(this.$view, "scroll", this._scrollVerticalHandler);
  };

  ScrollbarCell.prototype._updateLinkedViews = function () {};

  ScrollbarCell.prototype._initMouseWheel = function () {
    var ff = env.isFF;
    if (ff) this.$domEvents.attach(this._getRootParent().$view, "wheel", this._mouseWheelHandler, {
      passive: false
    });else this.$domEvents.attach(this._getRootParent().$view, "mousewheel", this._mouseWheelHandler, {
      passive: false
    });
  };

  ScrollbarCell.prototype.scrollHorizontally = function (left) {
    if (this._scrolling) return;
    this._scrolling = true;
    this.$scroll_hor.scrollLeft = left;
    this.$config.codeScrollLeft = left;
    left = this.$scroll_hor.scrollLeft;

    var views = this._getLinkedViews();

    for (var i = 0; i < views.length; i++) {
      if (views[i].scrollTo) {
        views[i].scrollTo(left, undefined);
      }
    }

    var oldSize = this.$config.scrollPosition;
    this.$config.scrollPosition = left;
    this.callEvent("onScroll", [oldSize, left, this.$config.scroll]);
    this._scrolling = false;
  };

  ScrollbarCell.prototype.scrollVertically = function (top) {
    if (this._scrolling) return;
    this._scrolling = true;
    this.$scroll_ver.scrollTop = top;
    top = this.$scroll_ver.scrollTop;

    var views = this._getLinkedViews();

    for (var i = 0; i < views.length; i++) {
      if (views[i].scrollTo) {
        views[i].scrollTo(undefined, top);
      }
    }

    var oldSize = this.$config.scrollPosition;
    this.$config.scrollPosition = top;
    this.callEvent("onScroll", [oldSize, top, this.$config.scroll]);
    this._scrolling = false;
  };

  ScrollbarCell.prototype._isVertical = function () {
    return this.$config.scroll == "y";
  };

  ScrollbarCell.prototype._isHorizontal = function () {
    return this.$config.scroll == "x";
  };

  ScrollbarCell.prototype._scrollHorizontalHandler = function (e) {
    if (this._isVertical() || this._scrolling) {
      return;
    } //in safari we can catch previous onscroll after setting new value from mouse-wheel event
    //set delay to prevent value drifiting


    if (new Date() - (this._wheel_time || 0) < 100) return true; //if (this.$gantt._touch_scroll_active) return;

    var left = this.$scroll_hor.scrollLeft;
    this.scrollHorizontally(left);
    this._oldLeft = this.$scroll_hor.scrollLeft;
  };

  ScrollbarCell.prototype._outerScrollHorizontalHandler = function (e) {
    if (this._isVertical()) {
      return;
    }
  };

  ScrollbarCell.prototype.show = function () {
    this.$parent.show();
  };

  ScrollbarCell.prototype.hide = function () {
    this.$parent.hide();
  };

  ScrollbarCell.prototype._getScrollSize = function () {
    var scrollSize = 0;
    var outerSize = 0;

    var isHorizontal = this._isHorizontal();

    var linked = this._getLinkedViews();

    var view;
    var scrollProperty = isHorizontal ? "scrollWidth" : "scrollHeight",
        innerSizeProperty = isHorizontal ? "contentX" : "contentY";
    var outerProperty = isHorizontal ? "x" : "y";

    var offset = this._getScrollOffset();

    for (var i = 0; i < linked.length; i++) {
      view = linked[i];
      if (!(view && view.$content && view.$content.getSize && !view.$config.hidden)) continue;
      var sizes = view.$content.getSize();
      var cellScrollSize;

      if (sizes.hasOwnProperty(scrollProperty)) {
        cellScrollSize = sizes[scrollProperty];
      } else {
        cellScrollSize = sizes[innerSizeProperty];
      }

      if (offset) {
        // precalculated vertical/horizontal offsets of scrollbar to emulate 4.x look
        if (sizes[innerSizeProperty] > sizes[outerProperty] && sizes[innerSizeProperty] > scrollSize && cellScrollSize > sizes[outerProperty] - offset + 2) {
          scrollSize = cellScrollSize + (isHorizontal ? 0 : 2);
          outerSize = sizes[outerProperty];
        }
      } else {
        var nonScrollableSize = Math.max(sizes[innerSizeProperty] - cellScrollSize, 0);
        var scrollableViewPortSize = Math.max(sizes[outerProperty] - nonScrollableSize, 0);
        cellScrollSize = cellScrollSize + nonScrollableSize;

        if (cellScrollSize > scrollableViewPortSize && cellScrollSize > scrollSize) {
          //|| (cellScrollSize === scrollSize && sizes[outerProperty] < outerSize) // same scroll width but smaller scrollable view port
          scrollSize = cellScrollSize;
          outerSize = sizes[outerProperty];
        }
      }
    }

    return {
      outerScroll: outerSize,
      innerScroll: scrollSize
    };
  };

  ScrollbarCell.prototype.scroll = function (position) {
    if (this._isHorizontal()) {
      this.scrollHorizontally(position);
    } else {
      this.scrollVertically(position);
    }
  };

  ScrollbarCell.prototype.getScrollState = function () {
    return {
      visible: this.isVisible(),
      direction: this.$config.scroll,
      size: this.$config.outerSize,
      scrollSize: this.$config.scrollSize || 0,
      position: this.$config.scrollPosition || 0
    };
  };

  ScrollbarCell.prototype.setSize = function (width, height) {
    _super.prototype.setSize.apply(this, arguments);

    var scrollSizes = this._getScrollSize();

    var ownSize = (this._isVertical() ? height : width) - this._getScrollOffset() + (this._isHorizontal() ? 1 : 0);

    if (scrollSizes.innerScroll && ownSize > scrollSizes.outerScroll) {
      scrollSizes.innerScroll += ownSize - scrollSizes.outerScroll;
    }

    this.$config.scrollSize = scrollSizes.innerScroll;
    this.$config.width = width;
    this.$config.height = height;

    this._setScrollSize(scrollSizes.innerScroll);
  };

  ScrollbarCell.prototype.isVisible = function () {
    return !!(this.$parent && this.$parent.$view.parentNode);
  };

  ScrollbarCell.prototype.shouldShow = function () {
    var scrollSizes = this._getScrollSize();

    if (!scrollSizes.innerScroll && this.$parent && this.$parent.$view.parentNode) {
      return false;
    } else if (scrollSizes.innerScroll && !(this.$parent && this.$parent.$view.parentNode)) {
      return true;
    } else {
      return false;
    }
  };

  ScrollbarCell.prototype.shouldHide = function () {
    var scrollSizes = this._getScrollSize();

    if (!scrollSizes.innerScroll && this.$parent && this.$parent.$view.parentNode) {
      return true;
    } else {
      return false;
    }
  };

  ScrollbarCell.prototype.toggleVisibility = function () {
    if (this.shouldHide()) {
      this.hide();
    } else if (this.shouldShow()) {
      this.show();
    }
  };

  ScrollbarCell.prototype._getScaleOffset = function (view) {
    var offset = 0;

    if (view && (view.$config.view == "timeline" || view.$config.view == "grid")) {
      offset = view.$content.$getConfig().scale_height;
    }

    return offset;
  };

  ScrollbarCell.prototype._getScrollOffset = function () {
    var offset = 0;

    if (this._isVertical()) {
      var parentLayout = this.$parent.$parent;
      offset = Math.max(this._getScaleOffset(parentLayout.getPrevSibling(this.$parent.$id)), this._getScaleOffset(parentLayout.getNextSibling(this.$parent.$id)));
    } else {
      var linked = this._getLinkedViews();

      for (var i = 0; i < linked.length; i++) {
        var view = linked[i],
            vparent = view.$parent;
        var cells = vparent.$cells;
        var last = cells[cells.length - 1];

        if (last && last.$config.view == "scrollbar" && last.$config.hidden === false) {
          offset = last.$config.width;
          break;
        }
      }
    }

    return offset || 0;
  };

  ScrollbarCell.prototype._setScrollSize = function (size) {
    var property = this._isHorizontal() ? "width" : "height";
    var scrollbar = this._isHorizontal() ? this.$scroll_hor : this.$scroll_ver;

    var offset = this._getScrollOffset();

    var node = scrollbar.firstChild;

    if (offset) {
      if (this._isVertical()) {
        this.$config.outerSize = this.$config.height - offset + 3;
        scrollbar.style.height = this.$config.outerSize + "px";
        scrollbar.style.top = offset - 1 + "px";
        domHelpers.addClassName(scrollbar, this.$parent._borders.top);
        domHelpers.addClassName(scrollbar.parentNode, "gantt_task_vscroll");
      } else {
        this.$config.outerSize = this.$config.width - offset + 1;
        scrollbar.style.width = this.$config.outerSize + "px"; //domHelpers.addClassName(scrollbar, this.$parent._borders.right);
      }
    } else {
      scrollbar.style.top = "auto";
      domHelpers.removeClassName(scrollbar, this.$parent._borders.top);
      domHelpers.removeClassName(scrollbar.parentNode, "gantt_task_vscroll");
      this.$config.outerSize = this.$config.height;
    }

    node.style[property] = size + "px";
  };

  ScrollbarCell.prototype._scrollVerticalHandler = function (e) {
    if (this._scrollHorizontalHandler() || this._scrolling) {
      return;
    } //if (this.$gantt._touch_scroll_active) return;


    var top = this.$scroll_ver.scrollTop;
    var prev = this._oldTop;
    if (top == prev) return;
    this.scrollVertically(top);
    this._oldTop = this.$scroll_ver.scrollTop;
  };

  ScrollbarCell.prototype._outerScrollVerticalHandler = function (e) {
    if (this._scrollHorizontalHandler()) {
      return;
    }
  };

  ScrollbarCell.prototype._checkWheelTarget = function (targetNode) {
    var connectedViews = this._getLinkedViews().concat(this);

    for (var i = 0; i < connectedViews.length; i++) {
      var node = connectedViews[i].$view;

      if (domHelpers.isChildOf(targetNode, node)) {
        return true;
      }
    }

    return false;
  };

  ScrollbarCell.prototype._mouseWheelHandler = function (e) {
    var target = e.target || e.srcElement;
    if (!this._checkWheelTarget(target)) return;
    this._wheel_time = new Date();
    var res = {};
    var wheelSpeed = {
      x: 1,
      y: 1
    };
    var wheelSpeedConfig = this.$gantt.config.wheel_scroll_sensitivity;

    if (typeof wheelSpeedConfig == "number" && !!wheelSpeedConfig) {
      wheelSpeed = {
        x: wheelSpeedConfig,
        y: wheelSpeedConfig
      };
    } else if ({}.toString.apply(wheelSpeedConfig) == "[object Object]") {
      wheelSpeed = {
        x: wheelSpeedConfig.x,
        y: wheelSpeedConfig.y
      };
    }

    var ff = env.isFF;
    var deltaX = ff ? e.deltaX : e.wheelDeltaX;
    var deltaY = ff ? e.deltaY : e.wheelDelta;
    var multiplier = -20;

    if (ff) {
      if (e.deltaMode !== 0) {
        multiplier = -40;
      } else {
        multiplier = -10;
      }
    }

    var wx = ff ? deltaX * multiplier * wheelSpeed.x : deltaX * 2 * wheelSpeed.x;
    var wy = ff ? deltaY * multiplier * wheelSpeed.y : deltaY * wheelSpeed.y;
    var horizontalScrollModifier = this.$gantt.config.horizontal_scroll_key;

    if (horizontalScrollModifier !== false) {
      if (SCROLL_MODIFIER_KEYS.indexOf(horizontalScrollModifier) >= 0) {
        if (e[horizontalScrollModifier] && !(e.deltaX || e.wheelDeltaX)) {
          // shift+mousewheel for horizontal scroll
          wx = wy * 2;
          wy = 0;
        }
      }
    }

    if (wx && Math.abs(wx) > Math.abs(wy)) {
      if (this._isVertical()) {
        return;
      }

      if (res.x) return true; //no horisontal scroll, must not block scrolling

      if (!this.$scroll_hor || !this.$scroll_hor.offsetWidth) return true;
      var dir = wx / -40;
      var oldLeft = this._oldLeft;
      var left = oldLeft + dir * 30;
      this.scrollHorizontally(left);
      this.$scroll_hor.scrollLeft = left; // not block scroll if position hasn't changed

      if (oldLeft == this.$scroll_hor.scrollLeft) {
        return true;
      }

      this._oldLeft = this.$scroll_hor.scrollLeft;
    } else {
      if (this._isHorizontal()) {
        return;
      }

      if (res.y) return true; //no vertical scroll, must not block scrolling

      if (!this.$scroll_ver || !this.$scroll_ver.offsetHeight) return true;
      var dir = wy / -40;
      if (typeof wy == "undefined") dir = e.detail;
      var oldTop = this._oldTop;
      var top = this.$scroll_ver.scrollTop + dir * 30; //if(!this.$gantt.config.prevent_default_scroll &&
      //	(this.$gantt._cached_scroll_pos && ((this.$gantt._cached_scroll_pos.y == top) || (this.$gantt._cached_scroll_pos.y <= 0 && top <= 0)))) return true;

      this.scrollVertically(top);
      this.$scroll_ver.scrollTop = top; // not block scroll if position hasn't changed

      if (oldTop == this.$scroll_ver.scrollTop) {
        return true;
      }

      this._oldTop = this.$scroll_ver.scrollTop;
    }

    if (e.preventDefault) e.preventDefault();
    e.cancelBubble = true;
    return false;
  };

  return ScrollbarCell;
}(Cell);

module.exports = ScrollbarCell;