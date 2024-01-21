/*
 	asserts will be removed in final code, so you can place them anythere
	without caring about performance impacts
*/
module.exports = function (gantt) {
  return function assert(check, message) {
    if (!check) {
      if (gantt.config.show_errors && gantt.callEvent("onError", [message]) !== false) {
        if (gantt.message) {
          gantt.message({
            type: "error",
            text: message,
            expire: -1
          });
        } else {
          // eslint-disable-next-line
          console.log(message);
        } // eslint-disable-next-line no-debugger


        debugger;
      }
    }
  };
};