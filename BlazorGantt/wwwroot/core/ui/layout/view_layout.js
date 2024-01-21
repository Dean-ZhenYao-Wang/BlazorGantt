var __extends = require("../../../utils/extends"),
    Layout = require("./layout"),
    Cell = require("./cell");

var ViewLayout = function (_super) {
  "use strict";

  __extends(ViewLayout, _super);

  function ViewLayout(parent, config, factory) {
    var _this = _super.apply(this, arguments) || this;

    for (var i = 0; i < _this.$cells.length; i++) {
      _this.$cells[i].$config.hidden = i !== 0;
    }

    _this.$cell = _this.$cells[0];
    _this.$name = "viewLayout";
    return _this;
  }

  ViewLayout.prototype.cell = function (id) {
    var cell = _super.prototype.cell.call(this, id);

    if (!cell.$view) {
      this.$fill(null, this);
    }

    return cell;
  };

  ViewLayout.prototype.moveView = function (view) {
    var body = this.$view;

    if (this.$cell) {
      this.$cell.$config.hidden = true;
      body.removeChild(this.$cell.$view);
    }

    this.$cell = view;
    body.appendChild(view.$view);
  };

  ViewLayout.prototype.setSize = function (x, y) {
    Cell.prototype.setSize.call(this, x, y);
  };

  ViewLayout.prototype.setContentSize = function () {
    var size = this.$lastSize;
    this.$cell.setSize(size.contentX, size.contentY);
  };

  ViewLayout.prototype.getSize = function () {
    var sizes = _super.prototype.getSize.call(this);

    if (this.$cell) {
      var cellSize = this.$cell.getSize();

      if (this.$config.byMaxSize) {
        for (var i = 0; i < this.$cells.length; i++) {
          var otherCell = this.$cells[i].getSize();

          for (var cell in cellSize) {
            cellSize[cell] = Math.max(cellSize[cell], otherCell[cell]);
          }
        }
      }

      for (var size in sizes) {
        sizes[size] = sizes[size] || cellSize[size];
      }

      sizes.gravity = Math.max(sizes.gravity, cellSize.gravity);
    }

    return sizes;
  };

  return ViewLayout;
}(Layout);

module.exports = ViewLayout;