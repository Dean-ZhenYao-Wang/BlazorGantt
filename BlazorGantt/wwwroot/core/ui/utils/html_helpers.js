var helpers = require("../../../utils/helpers");

var htmlHelpers = {
  getHtmlSelect: function getHtmlSelect(options, attributes, value) {
    var innerHTML = "";

    var _this = this;

    options = options || [];
    helpers.forEach(options, function (entry) {
      var _attributes = [{
        key: "value",
        value: entry.key
      }];

      if (value == entry.key) {
        _attributes[_attributes.length] = {
          key: "selected",
          value: "selected"
        };
      }

      if (entry.attributes) {
        _attributes = _attributes.concat(entry.attributes);
      }

      innerHTML += _this.getHtmlOption({
        innerHTML: entry.label
      }, _attributes);
    });
    return _getHtmlContainer("select", {
      innerHTML: innerHTML
    }, attributes);
  },
  getHtmlOption: function getHtmlOption(options, attributes) {
    return _getHtmlContainer("option", options, attributes);
  },
  getHtmlButton: function getHtmlButton(options, attributes) {
    return _getHtmlContainer("button", options, attributes);
  },
  getHtmlDiv: function getHtmlDiv(options, attributes) {
    return _getHtmlContainer("div", options, attributes);
  },
  getHtmlLabel: function getHtmlLabel(options, attributes) {
    return _getHtmlContainer("label", options, attributes);
  },
  getHtmlInput: function getHtmlInput(attributes) {
    return "<input" + _getHtmlAttributes(attributes || []) + ">";
  }
};

function _getHtmlContainer(tag, options, attributes) {
  var html;
  options = options || [];
  html = "<" + tag + _getHtmlAttributes(attributes || []) + ">" + (options.innerHTML || "") + "</" + tag + ">";
  return html;
}

function _getHtmlAttributes(attributes) {
  var html = "";
  helpers.forEach(attributes, function (entry) {
    html += " " + entry.key + "='" + entry.value + "'";
  });
  return html;
}

module.exports = htmlHelpers;