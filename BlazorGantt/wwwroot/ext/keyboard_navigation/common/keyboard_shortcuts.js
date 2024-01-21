module.exports = function (gantt) {
  gantt.$keyboardNavigation.shortcuts = {
    createCommand: function createCommand() {
      return {
        modifiers: {
          "shift": false,
          "alt": false,
          "ctrl": false,
          "meta": false
        },
        keyCode: null
      };
    },
    parse: function parse(shortcut) {
      var commands = [];
      var expr = this.getExpressions(this.trim(shortcut));

      for (var i = 0; i < expr.length; i++) {
        var words = this.getWords(expr[i]);
        var command = this.createCommand();

        for (var j = 0; j < words.length; j++) {
          if (this.commandKeys[words[j]]) {
            command.modifiers[words[j]] = true;
          } else if (this.specialKeys[words[j]]) {
            command.keyCode = this.specialKeys[words[j]];
          } else {
            command.keyCode = words[j].charCodeAt(0);
          }
        }

        commands.push(command);
      }

      return commands;
    },
    getCommandFromEvent: function getCommandFromEvent(domEvent) {
      var command = this.createCommand();
      command.modifiers.shift = !!domEvent.shiftKey;
      command.modifiers.alt = !!domEvent.altKey;
      command.modifiers.ctrl = !!domEvent.ctrlKey;
      command.modifiers.meta = !!domEvent.metaKey;
      command.keyCode = domEvent.which || domEvent.keyCode;

      if (command.keyCode >= 96 && command.keyCode <= 105) {
        // numpad keys 96-105 -> 48-57
        command.keyCode -= 48; //convert numpad  number code to regular number code
      }

      var printableKey = String.fromCharCode(command.keyCode);

      if (printableKey) {
        command.keyCode = printableKey.toLowerCase().charCodeAt(0);
      }

      return command;
    },
    getHashFromEvent: function getHashFromEvent(domEvent) {
      return this.getHash(this.getCommandFromEvent(domEvent));
    },
    getHash: function getHash(command) {
      var parts = [];

      for (var i in command.modifiers) {
        if (command.modifiers[i]) {
          parts.push(i);
        }
      }

      parts.push(command.keyCode);
      return parts.join(this.junctionChar);
    },
    getExpressions: function getExpressions(shortcut) {
      return shortcut.split(this.junctionChar);
    },
    getWords: function getWords(term) {
      return term.split(this.combinationChar);
    },
    trim: function trim(shortcut) {
      return shortcut.replace(/\s/g, "");
    },
    junctionChar: ",",
    combinationChar: "+",
    commandKeys: {
      "shift": 16,
      "alt": 18,
      "ctrl": 17,
      "meta": true
    },
    specialKeys: {
      "backspace": 8,
      "tab": 9,
      "enter": 13,
      "esc": 27,
      "space": 32,
      "up": 38,
      "down": 40,
      "left": 37,
      "right": 39,
      "home": 36,
      "end": 35,
      "pageup": 33,
      "pagedown": 34,
      "delete": 46,
      "insert": 45,
      "plus": 107,
      "f1": 112,
      "f2": 113,
      "f3": 114,
      "f4": 115,
      "f5": 116,
      "f6": 117,
      "f7": 118,
      "f8": 119,
      "f9": 120,
      "f10": 121,
      "f11": 122,
      "f12": 123
    }
  };
};