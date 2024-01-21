var defaultMapping = require("./keyboard_mappings/default");

var keyNavMappings = require("./keyboard_mappings/keyboard_navigation");

module.exports = function (gantt) {
  var mapping = null;
  return {
    setMapping: function setMapping(map) {
      mapping = map;
    },
    getMapping: function getMapping() {
      if (mapping) {
        return mapping;
      } else if (gantt.config.keyboard_navigation_cells && gantt.ext.keyboardNavigation) {
        return keyNavMappings;
      } else {
        return defaultMapping;
      }
    }
  };
};