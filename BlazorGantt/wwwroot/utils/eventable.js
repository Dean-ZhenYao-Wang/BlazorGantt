var EventHost = function EventHost() {
  this._silent_mode = false;
  this.listeners = {};
};

EventHost.prototype = {
  _silentStart: function _silentStart() {
    this._silent_mode = true;
  },
  _silentEnd: function _silentEnd() {
    this._silent_mode = false;
  }
};

var createEventStorage = function createEventStorage(obj) {
  var handlers = {};
  var index = 0;

  var eventStorage = function eventStorage() {
    var combinedResult = true;

    for (var i in handlers) {
      var handlerResult = handlers[i].apply(obj, arguments);
      combinedResult = combinedResult && handlerResult;
    }

    return combinedResult;
  };

  eventStorage.addEvent = function (handler, settings) {
    if (typeof handler == "function") {
      var handlerId;

      if (settings && settings.id) {
        handlerId = settings.id;
      } else {
        handlerId = index;
        index++;
      }

      if (settings && settings.once) {
        var originalHandler = handler;

        handler = function handler() {
          originalHandler();
          eventStorage.removeEvent(handlerId);
        };
      }

      handlers[handlerId] = handler;
      return handlerId;
    }

    return false;
  };

  eventStorage.removeEvent = function (id) {
    delete handlers[id];
  };

  eventStorage.clear = function () {
    handlers = {};
  };

  return eventStorage;
};

function makeEventable(obj) {
  var eventHost = new EventHost();

  obj.attachEvent = function (eventName, handler, settings) {
    eventName = 'ev_' + eventName.toLowerCase();

    if (!eventHost.listeners[eventName]) {
      eventHost.listeners[eventName] = createEventStorage(this);
    }

    if (settings && settings.thisObject) {
      handler = handler.bind(settings.thisObject);
    }

    var innerId = eventHost.listeners[eventName].addEvent(handler, settings);
    var handlerId = eventName + ':' + innerId; //return ID (ev_eventname:1)

    if (settings && settings.id) {
      handlerId = settings.id;
    }

    return handlerId;
  };

  obj.attachAll = function (callback) {
    this.attachEvent('listen_all', callback);
  };

  obj.callEvent = function (name, eventArguments) {
    if (eventHost._silent_mode) return true;
    var handlerName = 'ev_' + name.toLowerCase();
    var listeners = eventHost.listeners;

    if (listeners['ev_listen_all']) {
      listeners['ev_listen_all'].apply(this, [name].concat(eventArguments));
    }

    if (listeners[handlerName]) return listeners[handlerName].apply(this, eventArguments);
    return true;
  };

  obj.checkEvent = function (name) {
    var listeners = eventHost.listeners;
    return !!listeners['ev_' + name.toLowerCase()];
  };

  obj.detachEvent = function (id) {
    if (id) {
      var listeners = eventHost.listeners;

      for (var i in listeners) {
        listeners[i].removeEvent(id); //remove event
      }

      var list = id.split(':'); //get EventName and ID

      var listeners = eventHost.listeners;

      if (list.length === 2) {
        var eventName = list[0];
        var eventId = list[1];

        if (listeners[eventName]) {
          listeners[eventName].removeEvent(eventId); //remove event
        }
      }
    }
  };

  obj.detachAllEvents = function () {
    for (var name in eventHost.listeners) {
      eventHost.listeners[name].clear();
    }
  };
}

module.exports = makeEventable;