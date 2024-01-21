var utils = require("../../../utils/utils");

function createScope(addEvent, removeEvent) {
  addEvent = addEvent || utils.event;
  removeEvent = removeEvent || utils.eventRemove;
  var handlers = [];
  var eventScope = {
    attach: function attach(el, event, callback, capture) {
      handlers.push({
        element: el,
        event: event,
        callback: callback,
        capture: capture
      });
      addEvent(el, event, callback, capture);
    },
    detach: function detach(el, event, callback, capture) {
      removeEvent(el, event, callback, capture);

      for (var i = 0; i < handlers.length; i++) {
        var handler = handlers[i];

        if (handler.element === el && handler.event === event && handler.callback === callback && handler.capture === capture) {
          handlers.splice(i, 1);
          i--;
        }
      }
    },
    detachAll: function detachAll() {
      var staticArray = handlers.slice(); // original handlers array can be spliced on every iteration

      for (var i = 0; i < staticArray.length; i++) {
        var handler = staticArray[i];
        eventScope.detach(handler.element, handler.event, handler.callback, handler.capture);
        eventScope.detach(handler.element, handler.event, handler.callback, undefined);
        eventScope.detach(handler.element, handler.event, handler.callback, false);
        eventScope.detach(handler.element, handler.event, handler.callback, true);
      }

      handlers.splice(0, handlers.length);
    },
    extend: function extend() {
      return createScope(this.event, this.eventRemove);
    }
  };
  return eventScope;
}

module.exports = createScope;