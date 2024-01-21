var utils = require("../../utils/utils");

function extendSettings(store, parentSettings) {
  var own = this.$config[store];

  if (own) {
    if (!own.$extendedConfig) {
      own.$extendedConfig = true;
      Object.setPrototypeOf(own, parentSettings);
    }

    return own;
  } else {
    return parentSettings;
  }
}

var configurable = function configurable(parentView) {
  var parentConfig, parentTemplates;
  return {
    $getConfig: function $getConfig() {
      if (!parentConfig) {
        parentConfig = parentView ? parentView.$getConfig() : this.$gantt.config;
      }

      if (!this.$config.config) {
        return parentConfig;
      } else {
        return extendSettings.call(this, "config", parentConfig);
      }
    },
    $getTemplates: function $getTemplates() {
      if (!parentTemplates) {
        parentTemplates = parentView ? parentView.$getTemplates() : this.$gantt.templates;
      }

      if (!this.$config.templates) {
        return parentTemplates;
      } else {
        return extendSettings.call(this, "templates", parentTemplates);
      }
    }
  };
};

module.exports = function (obj, parent) {
  utils.mixin(obj, configurable(parent));
};