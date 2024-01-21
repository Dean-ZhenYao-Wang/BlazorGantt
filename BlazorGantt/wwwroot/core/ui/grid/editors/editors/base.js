module.exports = function (gantt) {
  var BaseEditor = function BaseEditor() {};

  BaseEditor.prototype = {
    show: function show(id, column, config, placeholder) {},
    hide: function hide() {},
    set_value: function set_value(value, id, column, node) {
      this.get_input(node).value = value;
    },
    get_value: function get_value(id, column, node) {
      return this.get_input(node).value || "";
    },
    is_changed: function is_changed(value, id, column, node) {
      var currentValue = this.get_value(id, column, node);

      if (currentValue && value && currentValue.valueOf && value.valueOf) {
        return currentValue.valueOf() != value.valueOf();
      } else {
        return currentValue != value;
      }
    },
    is_valid: function is_valid(value, id, column, node) {
      return true;
    },
    save: function save(id, column, node) {},
    get_input: function get_input(node) {
      return node.querySelector("input");
    },
    focus: function focus(node) {
      var input = this.get_input(node);

      if (!input) {
        return;
      }

      if (input.focus) {
        input.focus();
      }

      if (input.select) {
        input.select();
      }
    }
  };
  return BaseEditor;
};