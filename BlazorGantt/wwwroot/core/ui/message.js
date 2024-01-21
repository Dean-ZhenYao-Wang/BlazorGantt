function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var utils = require("../../utils/utils");

var domHelpers = require("./utils/dom_helpers");

module.exports = function (gantt) {
  var boxAttribute = "data-dhxbox";
  var _dhx_msg_cfg = null;

  function callback(config, result) {
    var usercall = config.callback;
    modalBox.hide(config.box);
    _dhx_msg_cfg = config.box = null;
    if (usercall) usercall(result);
  }

  function modal_key(event) {
    if (_dhx_msg_cfg) {
      var code = event.which || event.keyCode;
      var preventDefault = false;

      if (messageBox.keyboard) {
        if (code == 13 || code == 32) {
          // default behavior is to confirm/submit popup on space/enter
          // if browser focus is set on button element - do button click instead of default behavior
          var target = event.target || event.srcElement;

          if (domHelpers.getClassName(target).indexOf("gantt_popup_button") > -1 && target.click) {
            target.click();
          } else {
            callback(_dhx_msg_cfg, true);
            preventDefault = true;
          }
        }

        if (code == 27) {
          callback(_dhx_msg_cfg, false);
          preventDefault = true;
        }
      }

      if (preventDefault) {
        if (event.preventDefault) {
          event.preventDefault();
        }

        return !(event.cancelBubble = true);
      }

      return;
    }
  }

  var eventElement = domHelpers.getRootNode(gantt.$root) || document;
  gantt.event(eventElement, "keydown", modal_key, true);

  function modality(mode) {
    if (!modality.cover) {
      modality.cover = document.createElement("div"); //necessary for IE only

      modality.cover.onkeydown = modal_key;
      modality.cover.className = "dhx_modal_cover";
      document.body.appendChild(modality.cover);
    }

    modality.cover.style.display = mode ? "inline-block" : "none";
  }

  function button(text, className, result) {
    var buttonAriaAttrs = gantt._waiAria.messageButtonAttrString(text);

    var name = className.toLowerCase().replace(/ /g, "_");
    var button_css = "gantt_" + name + "_button";
    return "<div " + buttonAriaAttrs + " class='gantt_popup_button " + button_css + "' data-result='" + result + "' result='" + result + "' ><div>" + text + "</div></div>";
  }

  function info(text) {
    if (!messageBox.area) {
      messageBox.area = document.createElement("div");
      messageBox.area.className = "gantt_message_area";
      messageBox.area.style[messageBox.position] = "5px";
      document.body.appendChild(messageBox.area);
    }

    messageBox.hide(text.id);
    var message = document.createElement("div");
    message.innerHTML = "<div>" + text.text + "</div>";
    message.className = "gantt-info gantt-" + text.type;

    message.onclick = function () {
      messageBox.hide(text.id);
      text = null;
    };

    gantt._waiAria.messageInfoAttr(message);

    if (messageBox.position == "bottom" && messageBox.area.firstChild) messageBox.area.insertBefore(message, messageBox.area.firstChild);else messageBox.area.appendChild(message);
    if (text.expire > 0) messageBox.timers[text.id] = window.setTimeout(function () {
      // GS-1213: We need that when Gantt is destroyed
      if (messageBox) messageBox.hide(text.id);
    }, text.expire);
    messageBox.pull[text.id] = message;
    message = null;
    return text.id;
  }

  function getFirstDefined() {
    var values = [].slice.apply(arguments, [0]);

    for (var i = 0; i < values.length; i++) {
      if (values[i]) {
        return values[i];
      }
    }
  }

  function _boxStructure(config, ok, cancel) {
    var box = document.createElement("div");
    var contentId = utils.uid();

    gantt._waiAria.messageModalAttr(box, contentId);

    box.className = " gantt_modal_box gantt-" + config.type;
    box.setAttribute(boxAttribute, 1);
    var inner = '';
    if (config.width) box.style.width = config.width;
    if (config.height) box.style.height = config.height;
    if (config.title) inner += '<div class="gantt_popup_title">' + config.title + '</div>';
    inner += '<div class="gantt_popup_text" id="' + contentId + '"><span>' + (config.content ? '' : config.text) + '</span></div><div  class="gantt_popup_controls">';
    if (ok) inner += button(getFirstDefined(config.ok, gantt.locale.labels.message_ok, "OK"), "ok", true);
    if (cancel) inner += button(getFirstDefined(config.cancel, gantt.locale.labels.message_cancel, "Cancel"), "cancel", false);

    if (config.buttons) {
      for (var i = 0; i < config.buttons.length; i++) {
        var btn = config.buttons[i];

        if (_typeof(btn) == "object") {
          // Support { label:"Save", css:"main_button", value:"save" }
          var label = btn.label;
          var css = btn.css || "gantt_" + btn.label.toLowerCase() + "_button";
          var value = btn.value || i;
          inner += button(label, css, value);
        } else {
          inner += button(btn, btn, i);
        }
      }
    }

    inner += '</div>';
    box.innerHTML = inner;

    if (config.content) {
      var node = config.content;
      if (typeof node == "string") node = document.getElementById(node);
      if (node.style.display == 'none') node.style.display = "";
      box.childNodes[config.title ? 1 : 0].appendChild(node);
    }

    box.onclick = function (event) {
      var source = event.target || event.srcElement;
      if (!source.className) source = source.parentNode;

      if (domHelpers.closest(source, ".gantt_popup_button")) {
        var result = source.getAttribute("data-result");
        result = result == "true" || (result == "false" ? false : result);
        callback(config, result);
      }
    };

    config.box = box;
    if (ok || cancel) _dhx_msg_cfg = config;
    return box;
  }

  function _createBox(config, ok, cancel) {
    var box = config.tagName ? config : _boxStructure(config, ok, cancel);
    if (!config.hidden) modality(true);
    document.body.appendChild(box);
    var x = Math.abs(Math.floor(((window.innerWidth || document.documentElement.offsetWidth) - box.offsetWidth) / 2));
    var y = Math.abs(Math.floor(((window.innerHeight || document.documentElement.offsetHeight) - box.offsetHeight) / 2));
    if (config.position == "top") box.style.top = "-3px";else box.style.top = y + 'px';
    box.style.left = x + 'px'; //necessary for IE only

    box.onkeydown = modal_key;
    modalBox.focus(box);
    if (config.hidden) modalBox.hide(box);
    gantt.callEvent("onMessagePopup", [box]);
    return box;
  }

  function alertPopup(config) {
    return _createBox(config, true, false);
  }

  function confirmPopup(config) {
    return _createBox(config, true, true);
  }

  function boxPopup(config) {
    return _createBox(config);
  }

  function box_params(text, type, callback) {
    if (_typeof(text) != "object") {
      if (typeof type == "function") {
        callback = type;
        type = "";
      }

      text = {
        text: text,
        type: type,
        callback: callback
      };
    }

    return text;
  }

  function params(text, type, expire, id) {
    if (_typeof(text) != "object") text = {
      text: text,
      type: type,
      expire: expire,
      id: id
    };
    text.id = text.id || utils.uid();
    text.expire = text.expire || messageBox.expire;
    return text;
  }

  var alertBox = function alertBox() {
    var text = box_params.apply(this, arguments);
    text.type = text.type || "confirm";
    return alertPopup(text);
  };

  var confirmBox = function confirmBox() {
    var text = box_params.apply(this, arguments);
    text.type = text.type || "alert";
    return confirmPopup(text);
  };

  var modalBox = function modalBox() {
    var text = box_params.apply(this, arguments);
    text.type = text.type || "alert";
    return boxPopup(text);
  };

  modalBox.hide = function (node) {
    while (node && node.getAttribute && !node.getAttribute(boxAttribute)) {
      node = node.parentNode;
    }

    if (node) {
      node.parentNode.removeChild(node);
      modality(false);
      gantt.callEvent("onAfterMessagePopup", [node]);
    }
  };

  modalBox.focus = function (node) {
    setTimeout(function () {
      var focusable = domHelpers.getFocusableNodes(node);

      if (focusable.length) {
        if (focusable[0].focus) focusable[0].focus();
      }
    }, 1);
  };

  var messageBox = function messageBox(text, type, expire, id) {
    text = params.apply(this, arguments);
    text.type = text.type || "info";
    var subtype = text.type.split("-")[0];

    switch (subtype) {
      case "alert":
        return alertPopup(text);

      case "confirm":
        return confirmPopup(text);

      case "modalbox":
        return boxPopup(text);

      default:
        return info(text);
    }
  };

  messageBox.seed = new Date().valueOf();
  messageBox.uid = utils.uid;
  messageBox.expire = 4000;
  messageBox.keyboard = true;
  messageBox.position = "top";
  messageBox.pull = {};
  messageBox.timers = {};

  messageBox.hideAll = function () {
    for (var key in messageBox.pull) {
      messageBox.hide(key);
    }
  };

  messageBox.hide = function (id) {
    var obj = messageBox.pull[id];

    if (obj && obj.parentNode) {
      window.setTimeout(function () {
        obj.parentNode.removeChild(obj);
        obj = null;
      }, 2000);
      obj.className += " hidden";
      if (messageBox.timers[id]) window.clearTimeout(messageBox.timers[id]);
      delete messageBox.pull[id];
    }
  };

  var popups = [];
  gantt.attachEvent("onMessagePopup", function (box) {
    popups.push(box);
  });
  gantt.attachEvent("onAfterMessagePopup", function (box) {
    for (var i = 0; i < popups.length; i++) {
      if (popups[i] === box) {
        popups.splice(i, 1);
        i--;
      }
    }
  });
  gantt.attachEvent("onDestroy", function () {
    if (modality.cover && modality.cover.parentNode) {
      modality.cover.parentNode.removeChild(modality.cover);
    }

    for (var i = 0; i < popups.length; i++) {
      if (popups[i].parentNode) {
        popups[i].parentNode.removeChild(popups[i]);
      }
    }

    popups = null;

    if (messageBox.area && messageBox.area.parentNode) {
      messageBox.area.parentNode.removeChild(messageBox.area);
    }

    messageBox = null;
  });
  return {
    alert: alertBox,
    confirm: confirmBox,
    message: messageBox,
    modalbox: modalBox
  };
};