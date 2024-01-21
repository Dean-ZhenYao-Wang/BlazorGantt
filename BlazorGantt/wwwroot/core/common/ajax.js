function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var env = require("../../utils/env");

var global = require("../../utils/global");

var serialize = require("./serialize.ts")["default"];

function createConfig(method, args) {
  var result = {
    method: method
  };

  if (args.length === 0) {
    throw new Error("Arguments list of query is wrong.");
  }

  if (args.length === 1) {
    if (typeof args[0] === "string") {
      result.url = args[0];
      result.async = true;
    } else {
      result.url = args[0].url;
      result.async = args[0].async || true;
      result.callback = args[0].callback;
      result.headers = args[0].headers;
    }

    if (method === "POST" || "PUT") {
      if (args[0].data) {
        if (typeof args[0].data !== "string") {
          result.data = serialize(args[0].data);
        } else {
          result.data = args[0].data;
        }
      } else {
        result.data = "";
      }
    }

    return result;
  }

  result.url = args[0];

  switch (method) {
    case "GET":
    case "DELETE":
      result.callback = args[1];
      result.headers = args[2];
      break;

    case "POST":
    case "PUT":
      if (args[1]) {
        if (typeof args[1] !== "string") {
          result.data = serialize(args[1]);
        } else {
          result.data = args[1];
        }
      } else {
        result.data = "";
      }

      result.callback = args[2];
      result.headers = args[3];
      break;
  }

  return result;
}

module.exports = function (gantt) {
  return {
    // if false - dhxr param will added to prevent caching on client side (default),
    // if true - do not add extra params
    cache: true,
    // default method for load/loadStruct, post/get allowed
    // get - since 4.1.1, this should fix 412 error for macos safari
    method: "get",
    parse: function parse(data) {
      if (typeof data !== "string") return data;
      var obj;
      data = data.replace(/^[\s]+/, "");

      if (typeof DOMParser !== "undefined" && !env.isIE) {
        // ff,ie9
        obj = new DOMParser().parseFromString(data, "text/xml");
      } else if (typeof global.ActiveXObject !== "undefined") {
        obj = new global.ActiveXObject("Microsoft.XMLDOM");
        obj.async = "false";
        obj.loadXML(data);
      }

      return obj;
    },
    xmltop: function xmltop(tagname, xhr, obj) {
      if (typeof xhr.status == "undefined" || xhr.status < 400) {
        var xml = !xhr.responseXML ? this.parse(xhr.responseText || xhr) : xhr.responseXML || xhr;

        if (xml && xml.documentElement !== null && !xml.getElementsByTagName("parsererror").length) {
          return xml.getElementsByTagName(tagname)[0];
        }
      }

      if (obj !== -1) gantt.callEvent("onLoadXMLError", ["Incorrect XML", arguments[1], obj]);
      return document.createElement("DIV");
    },
    xpath: function xpath(xpathExp, docObj) {
      if (!docObj.nodeName) docObj = docObj.responseXML || docObj;

      if (env.isIE) {
        return docObj.selectNodes(xpathExp) || [];
      } else {
        var rows = [];
        var first;
        var col = (docObj.ownerDocument || docObj).evaluate(xpathExp, docObj, null, XPathResult.ANY_TYPE, null);

        while (true) {
          first = col.iterateNext();

          if (first) {
            rows.push(first);
          } else {
            break;
          }
        }

        return rows;
      }
    },
    query: function query(config) {
      return this._call(config.method || "GET", config.url, config.data || "", config.async || true, config.callback, config.headers);
    },
    get: function get(url, onLoad, headers) {
      var config = createConfig("GET", arguments);
      return this.query(config);
    },
    getSync: function getSync(url, headers) {
      var config = createConfig("GET", arguments);
      config.async = false;
      return this.query(config);
    },
    put: function put(url, postData, onLoad, headers) {
      var config = createConfig("PUT", arguments);
      return this.query(config);
    },
    del: function del(url, onLoad, headers) {
      /**
       * https://tools.ietf.org/html/rfc7231#section-4.3.5
       * A payload within a DELETE request message has no defined semantics;
       * sending a payload body on a DELETE request might cause some existing
       * implementations to reject the request.
       */
      var config = createConfig("DELETE", arguments);
      return this.query(config);
    },
    post: function post(url, postData, onLoad, headers) {
      if (arguments.length == 1) {
        postData = "";
      } else if (arguments.length == 2 && typeof postData == "function") {
        onLoad = postData;
        postData = "";
      }

      var config = createConfig("POST", arguments);
      return this.query(config);
    },
    postSync: function postSync(url, postData, headers) {
      postData = postData === null ? "" : String(postData);
      var config = createConfig("POST", arguments);
      config.async = false;
      return this.query(config);
    },
    _call: function _call(method, url, postData, async, onLoad, headers) {
      return new gantt.Promise(function (resolve, reject) {
        var t = (typeof XMLHttpRequest === "undefined" ? "undefined" : _typeof(XMLHttpRequest)) !== undefined ? new XMLHttpRequest() : new global.ActiveXObject("Microsoft.XMLHTTP");
        var isQt = navigator.userAgent.match(/AppleWebKit/) !== null && navigator.userAgent.match(/Qt/) !== null && navigator.userAgent.match(/Safari/) !== null;

        if (!!async) {
          t.onreadystatechange = function () {
            if (t.readyState == 4 || isQt && t.readyState == 3) {
              // what for long response and status 404?
              if (t.status != 200 || t.responseText === "") if (!gantt.callEvent("onAjaxError", [t])) return;
              setTimeout(function () {
                if (typeof onLoad == "function") {
                  onLoad.apply(global, [{
                    xmlDoc: t,
                    filePath: url
                  }]); // dhtmlx-compat, response.xmlDoc.responseXML/responseText
                }

                resolve(t);

                if (typeof onLoad == "function") {
                  onLoad = null;
                  t = null;
                }
              }, 0);
            }
          };
        }

        var noCache = !this || !this.cache;

        if (method == "GET" && noCache) {
          url += (url.indexOf("?") >= 0 ? "&" : "?") + "dhxr" + new Date().getTime() + "=1";
        }

        t.open(method, url, async);

        if (headers) {
          for (var key in headers) {
            t.setRequestHeader(key, headers[key]);
          }
        } else if (method.toUpperCase() == "POST" || method == "PUT" || method == "DELETE") {
          t.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        } else if (method == "GET") {
          postData = null;
        }

        t.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        t.send(postData);
        if (!async) return {
          xmlDoc: t,
          filePath: url
        }; // dhtmlx-compat, response.xmlDoc.responseXML/responseText
      });
    },
    urlSeparator: function urlSeparator(str) {
      if (str.indexOf("?") != -1) return "&";else return "?";
    }
  };
};