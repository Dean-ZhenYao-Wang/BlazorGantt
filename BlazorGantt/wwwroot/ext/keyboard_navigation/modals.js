module.exports = function (gantt) {
  (function () {
    var modalsStack = [];

    function isModal() {
      return !!modalsStack.length;
    }

    function afterPopup(box) {
      setTimeout(function () {
        if (!isModal()) {
          if (!gantt.$destroyed) {
            gantt.focus();
          }
        }
      }, 1);
    }

    function startModal(box) {
      gantt.eventRemove(box, "keydown", trapFocus);
      gantt.event(box, "keydown", trapFocus);
      modalsStack.push(box); //gantt.$keyboardNavigation.dispatcher.disable();
    }

    function endModal() {
      var box = modalsStack.pop();

      if (box) {
        gantt.eventRemove(box, "keydown", trapFocus);
      }

      afterPopup(box);
    }

    function isTopModal(box) {
      return box == modalsStack[modalsStack.length - 1];
    }

    function trapFocus(event) {
      var target = event.currentTarget;
      if (!isTopModal(target)) return;
      gantt.$keyboardNavigation.trapFocus(target, event);
    }

    function traceLightbox() {
      startModal(gantt.getLightbox());
    }

    gantt.attachEvent("onLightbox", traceLightbox);
    gantt.attachEvent("onAfterLightbox", endModal);
    gantt.attachEvent("onLightboxChange", function () {
      endModal();
      traceLightbox();
    });
    gantt.attachEvent("onAfterQuickInfo", function () {
      afterPopup();
    });
    gantt.attachEvent("onMessagePopup", function (box) {
      saveFocus();
      startModal(box);
    });
    gantt.attachEvent("onAfterMessagePopup", function () {
      endModal();
      restoreFocus();
    });
    var focusElement = null;

    function saveFocus() {
      focusElement = gantt.utils.dom.getActiveElement();
    }

    function restoreFocus() {
      setTimeout(function () {
        if (focusElement) {
          focusElement.focus();
          focusElement = null;
        }
      }, 1);
    }

    gantt.$keyboardNavigation.isModal = isModal;
  })();
};