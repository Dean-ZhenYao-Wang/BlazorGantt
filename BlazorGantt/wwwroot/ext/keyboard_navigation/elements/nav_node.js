module.exports = function (gantt) {
  gantt.$keyboardNavigation.KeyNavNode = function () {};

  gantt.$keyboardNavigation.KeyNavNode.prototype = gantt._compose(gantt.$keyboardNavigation.EventHandler, {
    isValid: function isValid() {
      return true;
    },
    fallback: function fallback() {
      return null;
    },
    moveTo: function moveTo(element) {
      gantt.$keyboardNavigation.dispatcher.setActiveNode(element);
    },
    compareTo: function compareTo(b) {
      // good enough comparison of two random objects
      if (!b) return false;

      for (var i in this) {
        if (!!this[i] != !!b[i]) return false;
        var canStringifyThis = !!(this[i] && this[i].toString);
        var canStringifyThat = !!(b[i] && b[i].toString);
        if (canStringifyThat != canStringifyThis) return false;

        if (!(canStringifyThat && canStringifyThis)) {
          if (b[i] != this[i]) return false;
        } else {
          if (b[i].toString() != this[i].toString()) return false;
        }
      }

      return true;
    },
    getNode: function getNode() {},
    focus: function focus() {
      var node = this.getNode();
      if (!node) return;
      var eventFacade = gantt.$keyboardNavigation.facade;

      if (eventFacade.callEvent("onBeforeFocus", [node]) === false) {
        return;
      }

      if (node) {
        node.setAttribute("tabindex", "-1");

        if (!node.$eventAttached) {
          node.$eventAttached = true;
          gantt.event(node, "focus", function (e) {
            e.preventDefault();
            return false;
          }, false);
        } //node.className += " gantt_focused";


        if (gantt.utils.dom.isChildOf(document.activeElement, node)) {
          node = document.activeElement;
        }

        if (node.focus) node.focus();
        eventFacade.callEvent("onFocus", [this.getNode()]);
      }
    },
    blur: function blur() {
      var node = this.getNode();

      if (node) {
        var eventFacade = gantt.$keyboardNavigation.facade;
        eventFacade.callEvent("onBlur", [node]);
        node.setAttribute("tabindex", "-1"); //node.className = (node.className || "").replace(/ ?gantt_focused/g, "");
      }
    }
  });
};