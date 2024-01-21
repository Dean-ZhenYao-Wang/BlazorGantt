module.exports = function (gantt) {
  (function () {
    var domHelpers = require("../../../core/ui/utils/dom_helpers");

    gantt.$keyboardNavigation.getFocusableNodes = domHelpers.getFocusableNodes;

    gantt.$keyboardNavigation.trapFocus = function trapFocus(root, e) {
      if (e.keyCode != 9) return false;
      var focusable = gantt.$keyboardNavigation.getFocusableNodes(root);
      var currentFocus = domHelpers.getActiveElement();
      var currentIndex = -1;

      for (var i = 0; i < focusable.length; i++) {
        if (focusable[i] == currentFocus) {
          currentIndex = i;
          break;
        }
      }

      if (e.shiftKey) {
        // back tab
        if (currentIndex <= 0) {
          // go to the last element if we focused on the first
          var lastItem = focusable[focusable.length - 1];

          if (lastItem) {
            lastItem.focus();
            e.preventDefault();
            return true;
          }
        }
      } else {
        // forward tab
        if (currentIndex >= focusable.length - 1) {
          // forward tab from last element should go back to the first element
          var firstItem = focusable[0];

          if (firstItem) {
            firstItem.focus();
            e.preventDefault();
            return true;
          }
        }
      }

      return false;
    };
  })();
};