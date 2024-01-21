var utils = require("./env");

module.exports = function (gantt) {
  return utils.isNode || !gantt.$root;
};