//returns position of html element on the page
function elementPosition(elem) {
  var top = 0,
      left = 0,
      right = 0,
      bottom = 0;

  if (elem.getBoundingClientRect) {
    //HTML5 method
    var box = elem.getBoundingClientRect();
    var body = document.body;
    var docElem = document.documentElement || document.body.parentNode || document.body;
    var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
    var clientTop = docElem.clientTop || body.clientTop || 0;
    var clientLeft = docElem.clientLeft || body.clientLeft || 0;
    top = box.top + scrollTop - clientTop;
    left = box.left + scrollLeft - clientLeft;
    right = document.body.offsetWidth - box.right;
    bottom = document.body.offsetHeight - box.bottom;
  } else {
    //fallback to naive approach
    while (elem) {
      top = top + parseInt(elem.offsetTop, 10);
      left = left + parseInt(elem.offsetLeft, 10);
      elem = elem.offsetParent;
    }

    right = document.body.offsetWidth - elem.offsetWidth - left;
    bottom = document.body.offsetHeight - elem.offsetHeight - top;
  }

  return {
    y: Math.round(top),
    x: Math.round(left),
    width: elem.offsetWidth,
    height: elem.offsetHeight,
    right: Math.round(right),
    bottom: Math.round(bottom)
  };
}

function isVisible(node) {
  var display = false,
      visibility = false;

  if (window.getComputedStyle) {
    var style = window.getComputedStyle(node, null);
    display = style["display"];
    visibility = style["visibility"];
  } else if (node.currentStyle) {
    display = node.currentStyle["display"];
    visibility = node.currentStyle["visibility"];
  }

  return display != "none" && visibility != "hidden";
}

function hasNonNegativeTabIndex(node) {
  return !isNaN(node.getAttribute("tabindex")) && node.getAttribute("tabindex") * 1 >= 0;
}

function hasHref(node) {
  var canHaveHref = {
    "a": true,
    "area": true
  };

  if (canHaveHref[node.nodeName.loLowerCase()]) {
    return !!node.getAttribute("href");
  }

  return true;
}

function isEnabled(node) {
  var canDisable = {
    "input": true,
    "select": true,
    "textarea": true,
    "button": true,
    "object": true
  };

  if (canDisable[node.nodeName.toLowerCase()]) {
    return !node.hasAttribute("disabled");
  }

  return true;
}

function getFocusableNodes(root) {
  var nodes = root.querySelectorAll(["a[href]", "area[href]", "input", "select", "textarea", "button", "iframe", "object", "embed", "[tabindex]", "[contenteditable]"].join(", "));
  var nodesArray = Array.prototype.slice.call(nodes, 0);

  for (var i = 0; i < nodesArray.length; i++) {
    nodesArray[i].$position = i; // we remember original nodes order, 
    // so when we sort them by tabindex we ensure order of nodes with same tabindex is preserved, 
    // since some browsers do unstable sort
  } // use tabindex to sort focusable nodes


  nodesArray.sort(function (a, b) {
    if (a.tabIndex === 0 && b.tabIndex !== 0) {
      return 1;
    }

    if (a.tabIndex !== 0 && b.tabIndex === 0) {
      return -1;
    }

    if (a.tabIndex === b.tabIndex) {
      // ensure we do stable sort
      return a.$position - b.$position;
    }

    if (a.tabIndex < b.tabIndex) {
      return -1;
    }

    return 1;
  });

  for (var i = 0; i < nodesArray.length; i++) {
    var node = nodesArray[i];
    var isValid = (hasNonNegativeTabIndex(node) || isEnabled(node) || hasHref(node)) && isVisible(node);

    if (!isValid) {
      nodesArray.splice(i, 1);
      i--;
    }
  }

  return nodesArray;
}

function getScrollSize() {
  var div = document.createElement("div");
  div.style.cssText = "visibility:hidden;position:absolute;left:-1000px;width:100px;padding:0px;margin:0px;height:110px;min-height:100px;overflow-y:scroll;";
  document.body.appendChild(div);
  var width = div.offsetWidth - div.clientWidth;
  document.body.removeChild(div);
  return width;
}

function getClassName(node) {
  if (!node) return "";
  var className = node.className || "";
  if (className.baseVal) //'className' exist but not a string - IE svg element in DOM
    className = className.baseVal;
  if (!className.indexOf) className = "";
  return _trimString(className);
}

function addClassName(node, className) {
  if (className && node.className.indexOf(className) === -1) {
    node.className += " " + className;
  }
}

function removeClassName(node, name) {
  name = name.split(" ");

  for (var i = 0; i < name.length; i++) {
    var regEx = new RegExp("\\s?\\b" + name[i] + "\\b(?![-_.])", "");
    node.className = node.className.replace(regEx, "");
  }
}

function hasClass(element, className) {
  if ('classList' in element) {
    return element.classList.contains(className);
  } else {
    return new RegExp("\\b" + className + "\\b").test(element.className);
  }
}

function toNode(node) {
  if (typeof node === "string") {
    return document.getElementById(node) || document.querySelector(node) || document.body;
  }

  return node || document.body;
}

var _slave;

function insert(node, newone) {
  if (!_slave) {
    _slave = document.createElement("div");
  }

  _slave.innerHTML = newone;
  var child = _slave.firstChild;
  node.appendChild(child);
  return child;
}

function remove(node) {
  if (node && node.parentNode) {
    node.parentNode.removeChild(node);
  }
}

function getChildren(node, css) {
  var ch = node.childNodes;
  var len = ch.length;
  var out = [];

  for (var i = 0; i < len; i++) {
    var obj = ch[i];

    if (obj.className && obj.className.indexOf(css) !== -1) {
      out.push(obj);
    }
  }

  return out;
}

function getTargetNode(e) {
  var trg;
  if (e.tagName) trg = e;else {
    e = e || window.event;
    trg = e.target || e.srcElement;

    if (trg.shadowRoot && e.composedPath) {
      trg = e.composedPath()[0];
    }
  }
  return trg;
}

function locateAttribute(e, attribute) {
  if (!attribute) return;
  var trg = getTargetNode(e);

  while (trg) {
    if (trg.getAttribute) {
      //text nodes has not getAttribute
      var test = trg.getAttribute(attribute);
      if (test) return trg;
    }

    trg = trg.parentNode;
  }

  return null;
}

function _trimString(str) {
  var func = String.prototype.trim || function () {
    return this.replace(/^\s+|\s+$/g, "");
  };

  return func.apply(str);
}

function locateClassName(e, classname, strict) {
  var trg = getTargetNode(e);
  var css = "";
  if (strict === undefined) strict = true;

  while (trg) {
    css = getClassName(trg);

    if (css) {
      var ind = css.indexOf(classname);

      if (ind >= 0) {
        if (!strict) return trg; //check that we have exact match

        var left = ind === 0 || !_trimString(css.charAt(ind - 1));
        var right = ind + classname.length >= css.length || !_trimString(css.charAt(ind + classname.length));
        if (left && right) return trg;
      }
    }

    trg = trg.parentNode;
  }

  return null;
}
/*
event position relatively to DOM element
 */


function getRelativeEventPosition(ev, node) {
  var d = document.documentElement;
  var box = elementPosition(node);
  return {
    x: ev.clientX + d.scrollLeft - d.clientLeft - box.x + node.scrollLeft,
    y: ev.clientY + d.scrollTop - d.clientTop - box.y + node.scrollTop
  };
}

function isChildOf(child, parent) {
  if (!child || !parent) {
    return false;
  }

  while (child && child != parent) {
    child = child.parentNode;
  }

  return child === parent;
}

function closest(element, selector) {
  if (element.closest) {
    return element.closest(selector);
  } else if (element.matches || element.msMatchesSelector || element.webkitMatchesSelector) {
    var el = element;
    if (!document.documentElement.contains(el)) return null;

    do {
      var method = el.matches || el.msMatchesSelector || el.webkitMatchesSelector;
      if (method.call(el, selector)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);

    return null;
  } else {
    // eslint-disable-next-line no-console
    console.error("Your browser is not supported");
    return null;
  }
}

function isShadowDomSupported() {
  return document.head.createShadowRoot || document.head.attachShadow;
}
/**
 * Returns element that has the browser focus, or null if no element has focus.
 * Works with shadow DOM, so it's prefereed to use this function instead of document.activeElement directly.
 * @returns HTMLElement
 */


function getActiveElement() {
  var activeElement = document.activeElement;

  if (activeElement.shadowRoot) {
    activeElement = activeElement.shadowRoot.activeElement;
  }

  if (activeElement === document.body && document.getSelection) {
    activeElement = document.getSelection().focusNode || document.body;
  }

  return activeElement;
}
/**
 * Returns document.body or the host node of the ShadowRoot, if the element is attached to ShadowDom
 * @param {HTMLElement} element 
 * @returns HTMLElement
 */


function getRootNode(element) {
  if (!element) {
    return document.body;
  }

  if (!isShadowDomSupported()) {
    return document.body;
  }

  while (element.parentNode && (element = element.parentNode)) {
    if (element instanceof ShadowRoot) {
      return element.host;
    }
  }

  return document.body;
}

function hasShadowParent(element) {
  return !!getRootNode(element);
}

module.exports = {
  getNodePosition: elementPosition,
  getFocusableNodes: getFocusableNodes,
  getScrollSize: getScrollSize,
  getClassName: getClassName,
  addClassName: addClassName,
  removeClassName: removeClassName,
  insertNode: insert,
  removeNode: remove,
  getChildNodes: getChildren,
  toNode: toNode,
  locateClassName: locateClassName,
  locateAttribute: locateAttribute,
  getTargetNode: getTargetNode,
  getRelativeEventPosition: getRelativeEventPosition,
  isChildOf: isChildOf,
  hasClass: hasClass,
  closest: closest,
  getRootNode: getRootNode,
  hasShadowParent: hasShadowParent,
  isShadowDomSupported: isShadowDomSupported,
  getActiveElement: getActiveElement
};