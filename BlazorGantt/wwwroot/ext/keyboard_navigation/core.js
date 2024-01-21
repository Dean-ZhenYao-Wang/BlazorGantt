module.exports = function (gantt) {
  gantt.$keyboardNavigation.dispatcher = {
    isActive: false,
    activeNode: null,
    globalNode: new gantt.$keyboardNavigation.GanttNode(),
    enable: function enable() {
      this.isActive = true;
      this.setActiveNode(this.getActiveNode());
    },
    disable: function disable() {
      this.isActive = false;
    },
    isEnabled: function isEnabled() {
      return !!this.isActive;
    },
    getDefaultNode: function getDefaultNode() {
      var node;

      if (gantt.config.keyboard_navigation_cells) {
        node = new gantt.$keyboardNavigation.TaskCell();
      } else {
        node = new gantt.$keyboardNavigation.TaskRow();
      }

      if (!node.isValid()) {
        node = node.fallback();
      }

      return node;
    },
    setDefaultNode: function setDefaultNode() {
      this.setActiveNode(this.getDefaultNode());
    },
    getActiveNode: function getActiveNode() {
      var node = this.activeNode;

      if (node && !node.isValid()) {
        node = node.fallback();
      }

      return node;
    },
    fromDomElement: function fromDomElement(e) {
      var inputs = [gantt.$keyboardNavigation.TaskRow, gantt.$keyboardNavigation.TaskCell, gantt.$keyboardNavigation.HeaderCell];

      for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].prototype.fromDomElement) {
          var node = inputs[i].prototype.fromDomElement(e);
          if (node) return node;
        }
      }

      return null;
    },
    focusGlobalNode: function focusGlobalNode() {
      this.blurNode(this.globalNode);
      this.focusNode(this.globalNode);
    },
    setActiveNode: function setActiveNode(el) {
      //console.trace()
      var focusChanged = true;

      if (this.activeNode) {
        if (this.activeNode.compareTo(el)) {
          focusChanged = false;
        }
      }

      if (this.isEnabled()) {
        if (focusChanged) this.blurNode(this.activeNode);
        this.activeNode = el;
        this.focusNode(this.activeNode, !focusChanged);
      }
    },
    focusNode: function focusNode(el, keptFocus) {
      if (el && el.focus) {
        el.focus(keptFocus);
      }
    },
    blurNode: function blurNode(el) {
      if (el && el.blur) {
        el.blur();
      }
    },
    keyDownHandler: function keyDownHandler(e) {
      if (gantt.$keyboardNavigation.isModal()) return;
      if (!this.isEnabled()) return;

      if (e.defaultPrevented) {
        return;
      }

      var ganttNode = this.globalNode;
      var command = gantt.$keyboardNavigation.shortcuts.getCommandFromEvent(e);
      var activeElement = this.getActiveNode();
      var eventFacade = gantt.$keyboardNavigation.facade;

      if (eventFacade.callEvent("onKeyDown", [command, e]) === false) {
        return;
      }

      if (!activeElement) {
        this.setDefaultNode();
      } else if (activeElement.findHandler(command)) {
        activeElement.doAction(command, e);
      } else if (ganttNode.findHandler(command)) {
        ganttNode.doAction(command, e);
      }
    },
    _timeout: null,
    awaitsFocus: function awaitsFocus() {
      return this._timeout !== null;
    },
    delay: function delay(callback, _delay) {
      clearTimeout(this._timeout);
      this._timeout = setTimeout(gantt.bind(function () {
        this._timeout = null;
        callback();
      }, this), _delay || 1);
    },
    clearDelay: function clearDelay() {
      clearTimeout(this._timeout);
    }
  };
};