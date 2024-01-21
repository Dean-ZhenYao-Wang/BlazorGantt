module.exports = function (gantt) {
  gantt.$keyboardNavigation.EventHandler = {
    _handlers: null,
    findHandler: function findHandler(command) {
      if (!this._handlers) this._handlers = {};
      var shortcuts = gantt.$keyboardNavigation.shortcuts;
      var hash = shortcuts.getHash(command);
      return this._handlers[hash];
    },
    doAction: function doAction(command, e) {
      var handler = this.findHandler(command);

      if (handler) {
        var eventFacade = gantt.$keyboardNavigation.facade;

        if (eventFacade.callEvent("onBeforeAction", [command, e]) === false) {
          return;
        }

        handler.call(this, e);
        if (e.preventDefault) e.preventDefault();else e.returnValue = false;
      }
    },
    bind: function bind(shortcut, handler) {
      if (!this._handlers) this._handlers = {};
      var shortcuts = gantt.$keyboardNavigation.shortcuts;
      var commands = shortcuts.parse(shortcut);

      for (var i = 0; i < commands.length; i++) {
        this._handlers[shortcuts.getHash(commands[i])] = handler;
      }
    },
    unbind: function unbind(shortcut) {
      var shortcuts = gantt.$keyboardNavigation.shortcuts;
      var commands = shortcuts.parse(shortcut);

      for (var i = 0; i < commands.length; i++) {
        if (this._handlers[shortcuts.getHash(commands[i])]) {
          delete this._handlers[shortcuts.getHash(commands[i])];
        }
      }
    },
    bindAll: function bindAll(map) {
      for (var i in map) {
        this.bind(i, map[i]);
      }
    },
    initKeys: function initKeys() {
      if (!this._handlers) this._handlers = {};

      if (this.keys) {
        this.bindAll(this.keys);
      }
    }
  };
};