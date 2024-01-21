var __extends = require("../../../../utils/extends");

module.exports = function (gantt) {
  var _super = require("./select_control")(gantt);

  function TypeselectControl() {
    var self = _super.apply(this, arguments) || this;
    return self;
  }

  __extends(TypeselectControl, _super);

  TypeselectControl.prototype.render = function (sns) {
    var types = gantt.config.types,
        locale = gantt.locale.labels,
        options = [];

    var filter = sns.filter || function (typeKey, typeValue) {
      if (!types.placeholder || typeValue !== types.placeholder) {
        return true;
      }

      return false;
    };

    for (var i in types) {
      if (!filter(i, types[i]) === false) {
        options.push({
          key: types[i],
          label: locale["type_" + i]
        });
      }
    }

    sns.options = options;
    var oldOnChange = sns.onchange;

    sns.onchange = function () {
      gantt.changeLightboxType(this.value);

      if (this.value === gantt.config.types.task) {
        gantt._lightbox_new_type = "task";
      }

      if (typeof oldOnChange == 'function') {
        oldOnChange.apply(this, arguments);
      }
    };

    return _super.prototype.render.apply(this, arguments);
  };

  return TypeselectControl;
};