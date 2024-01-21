var __extends = require("../../../utils/extends"),
    utils = require("../../../utils/utils"),
    Cell = require("./cell");

var ViewCell = function (_super) {
  "use strict";

  __extends(ViewCell, _super);

  function ViewCell(parent, config, factory) {
    var _this = _super.apply(this, arguments) || this;

    if (config.view) {
      if (config.id) {
        // pass id to the nested view
        this.$id = utils.uid();
      }

      var childConfig = utils.copy(config);
      delete childConfig.config;
      delete childConfig.templates;
      this.$content = this.$factory.createView(config.view, this, childConfig, this);
      if (!this.$content) return false;
    }

    _this.$name = "viewCell";
    return _this;
  }

  ViewCell.prototype.destructor = function () {
    this.clear();

    _super.prototype.destructor.call(this);
  };

  ViewCell.prototype.clear = function () {
    this.$initialized = false; // call destructor

    if (this.$content) {
      var method = this.$content.unload || this.$content.destructor;

      if (method) {
        method.call(this.$content);
      }
    }

    _super.prototype.clear.call(this);
  };

  ViewCell.prototype.scrollTo = function (left, top) {
    if (this.$content && this.$content.scrollTo) {
      this.$content.scrollTo(left, top);
    } else {
      _super.prototype.scrollTo.call(this, left, top);
    }
  };

  ViewCell.prototype._setContentSize = function (x, y) {
    var borders = this._getBorderSizes();

    if (typeof x === "number") {
      var outerX = x + borders.horizontal;
      this.$config.width = outerX;
    }

    if (typeof y === "number") {
      var outerY = y + borders.vertical;
      this.$config.height = outerY;
    }
  };

  ViewCell.prototype.setSize = function (x, y) {
    _super.prototype.setSize.call(this, x, y);

    if (!this.$preResize && this.$content) {
      if (!this.$initialized) {
        this.$initialized = true;
        var header = this.$view.childNodes[0];
        var content = this.$view.childNodes[1];
        if (!content) content = header;
        /*if(this.$content.$config){
        	this.$content.$config.width = this.$lastSize.contentX;
        	this.$content.$config.height = this.$lastSize.contentY;
        }*/

        this.$content.init(content);
      }
    }
  };

  ViewCell.prototype.setContentSize = function () {
    if (!this.$preResize && this.$content) {
      if (this.$initialized) {
        this.$content.setSize(this.$lastSize.contentX, this.$lastSize.contentY);
      }
    }
  };

  ViewCell.prototype.getContentSize = function () {
    var size = _super.prototype.getContentSize.call(this);

    if (this.$content && this.$initialized) {
      var childSize = this.$content.getSize();
      size.width = childSize.contentX === undefined ? childSize.width : childSize.contentX;
      size.height = childSize.contentY === undefined ? childSize.height : childSize.contentY;
    }

    var borders = this._getBorderSizes();

    size.width += borders.horizontal;
    size.height += borders.vertical;
    return size;
  };

  return ViewCell;
}(Cell);

module.exports = ViewCell;