function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

if (window.jQuery) {
  (function ($) {
    var methods = [];

    $.fn.dhx_gantt = function (config) {
      config = config || {};

      if (typeof config === 'string') {
        if (methods[config]) {
          return methods[config].apply(this, []);
        } else {
          $.error('Method ' + config + ' does not exist on jQuery.dhx_gantt');
        }
      } else {
        var views = [];
        this.each(function () {
          if (this && this.getAttribute) {
            if (!this.gantt && !(window.gantt.$root == this)) {
              var newgantt = window.gantt.$container && window.Gantt ? window.Gantt.getGanttInstance() : window.gantt;

              for (var key in config) {
                if (key != "data") newgantt.config[key] = config[key];
              }

              newgantt.init(this);
              if (config.data) newgantt.parse(config.data);
              views.push(newgantt);
            } else views.push(_typeof(this.gantt) == "object" ? this.gantt : window.gantt);
          }
        });
        if (views.length === 1) return views[0];
        return views;
      }
    };
  })(window.jQuery);
}

module.exports = null;