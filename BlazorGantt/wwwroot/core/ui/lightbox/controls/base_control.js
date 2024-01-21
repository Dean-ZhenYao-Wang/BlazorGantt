function dummy() {
  // eslint-disable-next-line
  console.log("Method is not implemented.");
}

function BaseControl() {} // base methods will be runned in gantt context


BaseControl.prototype.render = dummy; // arguments: sns

BaseControl.prototype.set_value = dummy; // arguments: node, value, ev, sns(config)

BaseControl.prototype.get_value = dummy; // arguments node, ev, sns(config)

BaseControl.prototype.focus = dummy; // arguments: node

module.exports = function (gantt) {
  // we could send current instance of gantt to module
  return BaseControl;
};