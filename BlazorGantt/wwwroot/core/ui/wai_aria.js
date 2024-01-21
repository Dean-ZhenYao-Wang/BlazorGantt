module.exports = function (gantt) {
  // TODO: why eslint fails on regexp?
  // eslint-disable-next-line no-control-regex
  var htmlTags = new RegExp("<(?:.|\n)*?>", "gm");
  var extraSpaces = new RegExp(" +", "gm");

  function stripHTMLLite(htmlText) {
    return (htmlText + "").replace(htmlTags, " ").replace(extraSpaces, " ");
  }

  var singleQuotes = new RegExp("'", "gm");

  function escapeQuotes(text) {
    return (text + "").replace(singleQuotes, "&#39;");
  }

  gantt._waiAria = {
    getAttributeString: function getAttributeString(attr) {
      var attributes = [" "];

      for (var i in attr) {
        var text = escapeQuotes(stripHTMLLite(attr[i]));
        attributes.push(i + "='" + text + "'");
      }

      attributes.push(" ");
      return attributes.join(" ");
    },
    getTimelineCellAttr: function getTimelineCellAttr(dateString) {
      return gantt._waiAria.getAttributeString({
        "aria-label": dateString
      });
    },
    _taskCommonAttr: function _taskCommonAttr(task, div) {
      if (!(task.start_date && task.end_date)) return;
      div.setAttribute("aria-label", stripHTMLLite(gantt.templates.tooltip_text(task.start_date, task.end_date, task)));

      if (task.$dataprocessor_class) {
        div.setAttribute("aria-busy", true);
      }
    },
    setTaskBarAttr: function setTaskBarAttr(task, div) {
      this._taskCommonAttr(task, div); // task bars are complex elements that should be treated as a single element


      div.setAttribute("role", "img");

      if (!gantt.isReadonly(task) && gantt.config.drag_move) {
        if (task.id != gantt.getState("tasksDnd").drag_id) {
          div.setAttribute("aria-grabbed", false);
        } else {
          div.setAttribute("aria-grabbed", true);
        }
      }
    },
    taskRowAttr: function taskRowAttr(task, div) {
      this._taskCommonAttr(task, div);

      if (!gantt.isReadonly(task) && gantt.config.order_branch) {
        div.setAttribute("aria-grabbed", false);
      }

      div.setAttribute("role", "row"); // selected attribute should be added only to the grid  because
      // other parts don't have the keyboard navigation

      div.setAttribute("aria-selected", gantt.isSelectedTask(task.id) ? "true" : "false"); // allowed values start from 1, set 1 for non-tree datastores

      div.setAttribute("aria-level", task.$level + 1 || 1);

      if (gantt.hasChild(task.id)) {
        div.setAttribute("aria-expanded", task.$open ? "true" : "false");
      }
    },
    linkAttr: function linkAttr(link, div) {
      var linkTypes = gantt.config.links;
      var toStart = link.type == linkTypes.finish_to_start || link.type == linkTypes.start_to_start;
      var fromStart = link.type == linkTypes.start_to_start || link.type == linkTypes.start_to_finish;
      var content = gantt.locale.labels.link + " " + gantt.templates.drag_link(link.source, fromStart, link.target, toStart); // links are complex elements that should be treated as a single element

      div.setAttribute("role", "img");
      div.setAttribute("aria-label", stripHTMLLite(content));

      if (gantt.isReadonly(link)) {
        div.setAttribute("aria-readonly", true);
      }
    },
    gridSeparatorAttr: function gridSeparatorAttr(div) {
      // the only valid role for the grid header
      div.setAttribute("role", "columnheader");
    },
    rowResizerAttr: function rowResizerAttr(div) {
      // the only valid role for the grid header
      div.setAttribute("role", "row");
    },
    lightboxHiddenAttr: function lightboxHiddenAttr(div) {
      div.setAttribute("aria-hidden", "true");
    },
    lightboxVisibleAttr: function lightboxVisibleAttr(div) {
      div.setAttribute("aria-hidden", "false");
    },
    lightboxAttr: function lightboxAttr(div) {
      div.setAttribute("role", "dialog");
      div.setAttribute("aria-hidden", "true");
      div.firstChild.setAttribute("role", "heading");
      div.firstChild.setAttribute("aria-level", "1");
    },
    lightboxButtonAttrString: function lightboxButtonAttrString(buttonName) {
      return this.getAttributeString({
        "role": "button",
        "aria-label": gantt.locale.labels[buttonName],
        "tabindex": "0"
      });
    },
    lightboxHeader: function lightboxHeader(div, headerText) {
      div.setAttribute("aria-label", headerText);
    },
    lightboxSelectAttrString: function lightboxSelectAttrString(time_option) {
      var label = "";

      switch (time_option) {
        case "%Y":
          label = gantt.locale.labels.years;
          break;

        case "%m":
          label = gantt.locale.labels.months;
          break;

        case "%d":
          label = gantt.locale.labels.days;
          break;

        case "%H:%i":
          label = gantt.locale.labels.hours + gantt.locale.labels.minutes;
          break;

        default:
          break;
      }

      return gantt._waiAria.getAttributeString({
        "aria-label": label
      });
    },
    lightboxDurationInputAttrString: function lightboxDurationInputAttrString(section) {
      return this.getAttributeString({
        "aria-label": gantt.locale.labels.column_duration,
        "aria-valuemin": "0",
        "role": "spinbutton"
      });
    },
    inlineEditorAttr: function inlineEditorAttr(div) {
      div.setAttribute("role", "row");
    },
    gridAttrString: function gridAttrString() {
      return [" role='treegrid'", gantt.config.multiselect ? "aria-multiselectable='true'" : "aria-multiselectable='false'", " "].join(" ");
    },
    gridScaleRowAttrString: function gridScaleRowAttrString() {
      return "role='row'";
    },
    gridScaleCellAttrString: function gridScaleCellAttrString(column, label) {
      var attrs = "";

      if (column.name == "add") {
        // a more precise role is button, but it is not valid for the grid header
        attrs = this.getAttributeString({
          "role": "columnheader",
          "aria-label": gantt.locale.labels.new_task
        });
      } else {
        var attributes = {
          "role": "columnheader",
          "aria-label": label
        };

        if (gantt._sort && gantt._sort.name == column.name) {
          if (gantt._sort.direction == "asc") {
            attributes["aria-sort"] = "ascending";
          } else {
            attributes["aria-sort"] = "descending";
          }
        }

        attrs = this.getAttributeString(attributes);
      }

      return attrs;
    },
    gridDataAttrString: function gridDataAttrString() {
      return "role='rowgroup'";
    },
    reorderMarkerAttr: function reorderMarkerAttr(div) {
      div.setAttribute("role", "grid");
      div.firstChild.removeAttribute("aria-level");
      div.firstChild.setAttribute("aria-grabbed", "true");
    },
    gridCellAttrString: function gridCellAttrString(column, textValue, task) {
      var attributes = {
        "role": "gridcell",
        "aria-label": textValue
      };

      if (!column.editor || gantt.isReadonly(task)) {
        attributes["aria-readonly"] = true;
      }

      return this.getAttributeString(attributes);
    },
    gridAddButtonAttrString: function gridAddButtonAttrString(column) {
      return this.getAttributeString({
        "role": "button",
        "aria-label": gantt.locale.labels.new_task
      });
    },
    messageButtonAttrString: function messageButtonAttrString(buttonLabel) {
      return "tabindex='0' role='button' aria-label='" + buttonLabel + "'";
    },
    messageInfoAttr: function messageInfoAttr(div) {
      div.setAttribute("role", "alert"); //div.setAttribute("tabindex", "-1");
    },
    messageModalAttr: function messageModalAttr(div, uid) {
      div.setAttribute("role", "dialog");

      if (uid) {
        div.setAttribute("aria-labelledby", uid);
      } //	div.setAttribute("tabindex", "-1");

    },
    quickInfoAttr: function quickInfoAttr(div) {
      div.setAttribute("role", "dialog");
    },
    quickInfoHeaderAttrString: function quickInfoHeaderAttrString() {
      return " role='heading' aria-level='1' ";
    },
    quickInfoHeader: function quickInfoHeader(div, header) {
      div.setAttribute("aria-label", header);
    },
    quickInfoButtonAttrString: function quickInfoButtonAttrString(label) {
      return gantt._waiAria.getAttributeString({
        "role": "button",
        "aria-label": label,
        "tabindex": "0"
      });
    },
    tooltipAttr: function tooltipAttr(div) {
      div.setAttribute("role", "tooltip");
    },
    tooltipVisibleAttr: function tooltipVisibleAttr(div) {
      div.setAttribute("aria-hidden", "false");
    },
    tooltipHiddenAttr: function tooltipHiddenAttr(div) {
      div.setAttribute("aria-hidden", "true");
    }
  };

  function isDisabled() {
    return !gantt.config.wai_aria_attributes;
  }

  for (var i in gantt._waiAria) {
    gantt._waiAria[i] = function (payload) {
      return function () {
        if (isDisabled()) {
          return "";
        }

        return payload.apply(this, arguments);
      };
    }(gantt._waiAria[i]);
  }
};