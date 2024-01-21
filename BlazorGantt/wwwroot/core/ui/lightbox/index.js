function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

module.exports = function (gantt) {
  var domHelpers = require("../utils/dom_helpers");

  var helpers = require("../../../utils/helpers");

  var TemplateControl = require("./controls/template_control")(gantt);

  var TextareaControl = require("./controls/textarea_control")(gantt);

  var TimeControl = require("./controls/time_control")(gantt);

  var SelectControl = require("./controls/select_control")(gantt);

  var CheckboxControl = require("./controls/checkbox_control")(gantt);

  var RadioControl = require("./controls/radio_control")(gantt);

  var DurationControl = require("./controls/duration_control")(gantt);

  var ParentControl = require("./controls/parent_control")(gantt);

    var ResourcesControl = require("./controls/select_control.js")(gantt);

  var ConstraintControl = require("./controls/constraint_control")(gantt);

  var TypeselectControl = require("./controls/typeselect_control")(gantt);

  gantt._lightbox_methods = {};
  gantt._lightbox_template = "<div class='gantt_cal_ltitle'><span class='gantt_mark'>&nbsp;</span><span class='gantt_time'></span><span class='gantt_title'></span></div><div class='gantt_cal_larea'></div>"; // GS-1952. Attaching the lightbox to the BODY element is not considered secure.
  // Attach it to Gantt container for Salesforce and other secure environments

  gantt._lightbox_root = gantt.$root;

  function setParentNode() {
    var cspEnvironment = gantt.config.csp === true;
    var salesforceEnvironment = !!window["Sfdc"] || !!window["$A"] || window["Aura"] || '$shadowResolver$' in document.body;

    if (cspEnvironment || salesforceEnvironment) {
      gantt._lightbox_root = gantt.$root;
    } else {
      gantt._lightbox_root = document.body;
    }
  } //TODO: gantt._lightbox_id is changed from data.js and accessed from autoscheduling, check if it can be removed from gantt object


  var state = gantt.$services.getService("state");
  state.registerProvider("lightbox", function () {
    return {
      lightbox: gantt._lightbox_id
    };
  });

  gantt.showLightbox = function (id) {
    if (!this.callEvent("onBeforeLightbox", [id])) return;
    var task = this.getTask(id);
    var box = this.getLightbox(this.getTaskType(task.type));

    this._center_lightbox(box);

    this.showCover();

    this._fill_lightbox(id, box);

    this._waiAria.lightboxVisibleAttr(box);

    this.callEvent("onLightbox", [id]);
  };

  function _is_chart_visible(gantt) {
    var timeline = gantt.$ui.getView("timeline");

    if (timeline && timeline.isVisible()) {
      return true;
    } else {
      return false;
    }
  }

  gantt._get_timepicker_step = function () {
    if (this.config.round_dnd_dates) {
      var step;

      if (_is_chart_visible(this)) {
        var scale = gantt.getScale();
        step = helpers.getSecondsInUnit(scale.unit) * scale.step / 60; //timepicker step is measured in minutes
      }

      if (!step || step >= 60 * 24) {
        step = this.config.time_step;
      }

      return step;
    }

    return this.config.time_step;
  };

  gantt.getLabel = function (property, key) {
    var sections = this._get_typed_lightbox_config();

    for (var i = 0; i < sections.length; i++) {
      if (sections[i].map_to == property) {
        var options = sections[i].options;

        for (var j = 0; j < options.length; j++) {
          if (options[j].key == key) {
            return options[j].label;
          }
        }
      }
    }

    return "";
  };

  gantt.updateCollection = function (list_name, collection) {
    collection = collection.slice(0);
    var list = gantt.serverList(list_name);
    if (!list) return false;
    list.splice(0, list.length);
    list.push.apply(list, collection || []);
    gantt.resetLightbox();
  };

  gantt.getLightboxType = function () {
    return this.getTaskType(this._lightbox_type);
  };

  gantt.getLightbox = function (type) {
    var lightboxDiv;
    var fullWidth;
    var html;
    var sns;
    var ds;
    var classNames = "";
    setParentNode();
    if (type === undefined) type = this.getLightboxType();

    if (!this._lightbox || this.getLightboxType() != this.getTaskType(type)) {
      this._lightbox_type = this.getTaskType(type);
      lightboxDiv = document.createElement("div");
      classNames = "gantt_cal_light";
      fullWidth = this._is_lightbox_timepicker();
      if (gantt.config.wide_form || fullWidth) classNames += " gantt_cal_light_wide";

      if (fullWidth) {
        gantt.config.wide_form = true;
        classNames += " gantt_cal_light_full";
      }

      lightboxDiv.className = classNames;
      lightboxDiv.style.visibility = "hidden";
      html = this._lightbox_template;
      html += getHtmlButtons(this.config.buttons_left);
      html += getHtmlButtons(this.config.buttons_right, true);
      lightboxDiv.innerHTML = html;

      gantt._waiAria.lightboxAttr(lightboxDiv);

      if (gantt.config.drag_lightbox) {
        lightboxDiv.firstChild.onmousedown = gantt._ready_to_dnd;

        lightboxDiv.firstChild.onselectstart = function () {
          return false;
        };

        lightboxDiv.firstChild.style.cursor = "pointer";

        gantt._init_dnd_events();
      } // GS-1428: If there is lightbox node, we need to remove it from the DOM


      if (this._lightbox) {
        this.resetLightbox();
      }

      gantt._lightbox_root.insertBefore(lightboxDiv, gantt._lightbox_root.firstChild);

      this._lightbox = lightboxDiv;
      sns = this._get_typed_lightbox_config(type);
      html = this._render_sections(sns);
      ds = lightboxDiv.querySelector("div.gantt_cal_larea"); //GS-1131. If gantt_cal_larea is displayed, Firefox renders buttons incorrectly;

      var backup_overflow = ds.style.overflow;
      ds.style.overflow = 'hidden';
      ds.innerHTML = html;
      bindLabelsToInputs(sns); //sizes

      this.resizeLightbox();
      ds.style.overflow = backup_overflow;

      this._init_lightbox_events(this);

      lightboxDiv.style.display = "none";
      lightboxDiv.style.visibility = "visible";
    }

    return this._lightbox;
  };

  gantt._render_sections = function (sns) {
    var html = "";

    for (var i = 0; i < sns.length; i++) {
      var block = this.form_blocks[sns[i].type];
      if (!block) continue; //ignore incorrect blocks

      sns[i].id = "area_" + this.uid();
      var display = sns[i].hidden ? " style='display:none'" : "";
      var button = "";

      if (sns[i].button) {
        button = "<div class='gantt_custom_button' data-index='" + i + "'><div class='gantt_custom_button_" + sns[i].button + "'></div><div class='gantt_custom_button_label'>" + this.locale.labels["button_" + sns[i].button] + "</div></div>";
      }

      if (this.config.wide_form) {
        html += "<div class='gantt_wrap_section' " + display + ">";
      }

      html += "<div id='" + sns[i].id + "' class='gantt_cal_lsection'><label>" + button + this.locale.labels["section_" + sns[i].name] + "</label></div>" + block.render.call(this, sns[i]);
      html += "</div>";
    }

    return html;
  };

  gantt.resizeLightbox = function () {
    if (!this._lightbox) return;

    var con = this._lightbox.querySelector(".gantt_cal_larea");

    con.style.height = "0px";
    con.style.height = con.scrollHeight + "px";
    this._lightbox.style.height = con.scrollHeight + this.config.lightbox_additional_height + "px";
    con.style.height = con.scrollHeight + "px"; //it is incredible , how ugly IE can be
  };

  gantt._center_lightbox = function (box) {
    if (box) {
      box.style.display = "block";
      var scroll_top = window.pageYOffset || gantt._lightbox_root.scrollTop || document.documentElement.scrollTop;
      var scroll_left = window.pageXOffset || gantt._lightbox_root.scrollLeft || document.documentElement.scrollLeft;
      var view_height = window.innerHeight || document.documentElement.clientHeight;
      if (scroll_top) // if vertical scroll on window
        box.style.top = Math.round(scroll_top + Math.max((view_height - box.offsetHeight) / 2, 0)) + "px";else // vertical scroll on body
        box.style.top = Math.round(Math.max((view_height - box.offsetHeight) / 2, 0) + 9) + "px"; // +9 for compatibility with auto tests
      // not quite accurate but used for compatibility reasons

      if (document.documentElement.scrollWidth > gantt._lightbox_root.offsetWidth) // if horizontal scroll on the window
        box.style.left = Math.round(scroll_left + (gantt._lightbox_root.offsetWidth - box.offsetWidth) / 2) + "px";else // horizontal scroll on the body
        box.style.left = Math.round((gantt._lightbox_root.offsetWidth - box.offsetWidth) / 2) + "px";
    }
  };

  gantt.showCover = function () {
    if (this._cover) return;
    this._cover = document.createElement("DIV");
    this._cover.className = "gantt_cal_cover";
    var rootElement = gantt._lightbox_root || gantt.$root;
    rootElement.appendChild(this._cover);
  };

  gantt.event(window, "deviceorientation", function () {
    if (gantt.getState().lightbox) {
      gantt._center_lightbox(gantt.getLightbox());
    }
  });

  gantt._init_lightbox_events = function () {
    gantt.lightbox_events = {};

    gantt.lightbox_events.gantt_save_btn = function () {
      gantt._save_lightbox();
    };

    gantt.lightbox_events.gantt_delete_btn = function () {
      gantt._lightbox_new_type = null;
      if (!gantt.callEvent("onLightboxDelete", [gantt._lightbox_id])) return;

      if (gantt.isTaskExists(gantt._lightbox_id)) {
        gantt.$click.buttons["delete"](gantt._lightbox_id);
      } else {
        gantt.hideLightbox();
      }
    };

    gantt.lightbox_events.gantt_cancel_btn = function () {
      gantt._cancel_lightbox();
    };

    gantt.lightbox_events["default"] = function (e, src) {
      if (src.getAttribute("data-dhx-button")) {
        gantt.callEvent("onLightboxButton", [src.className, src, e]);
      } else {
        var index, block, sec;
        var className = domHelpers.getClassName(src);

        if (className.indexOf("gantt_custom_button") != -1) {
          if (className.indexOf("gantt_custom_button_") != -1) {
            index = src.parentNode.getAttribute("data-index");
            sec = src;

            while (sec && domHelpers.getClassName(sec).indexOf("gantt_cal_lsection") == -1) {
              sec = sec.parentNode;
            }
          } else {
            index = src.getAttribute("data-index");
            sec = src.parentNode;
            src = src.firstChild;
          }
        }

        var sections = gantt._get_typed_lightbox_config();

        if (index) {
          index = index * 1;
          block = gantt.form_blocks[sections[index * 1].type];
          block.button_click(index, src, sec, sec.nextSibling);
        }
      }
    };

    this.event(gantt.getLightbox(), "click", function (e) {
      e = e || window.event;
      var src = domHelpers.getTargetNode(e);
      var className = domHelpers.getClassName(src);

      if (!className) {
        src = src.previousSibling;
        className = domHelpers.getClassName(src);
      }

      if (src && className && className.indexOf("gantt_btn_set") === 0) {
        src = src.firstChild;
        className = domHelpers.getClassName(src);
      }

      if (src && className) {
        var func = gantt.defined(gantt.lightbox_events[src.className]) ? gantt.lightbox_events[src.className] : gantt.lightbox_events["default"];
        return func(e, src);
      }

      return false;
    });

    gantt.getLightbox().onkeydown = function (e) {
      var event = e || window.event;
      var target = e.target || e.srcElement;
      var buttonTarget = domHelpers.getClassName(target).indexOf("gantt_btn_set") > -1;

      switch ((e || event).keyCode) {
        case gantt.constants.KEY_CODES.SPACE:
          {
            if ((e || event).shiftKey) return;

            if (buttonTarget && target.click) {
              target.click();
            }

            break;
          }

        case gantt.keys.edit_save:
          if ((e || event).shiftKey) return;

          if (buttonTarget && target.click) {
            target.click();
          } else {
            gantt._save_lightbox();
          }

          break;

        case gantt.keys.edit_cancel:
          gantt._cancel_lightbox();

          break;

        default:
          break;
      }
    };
  };

  gantt._cancel_lightbox = function () {
    var task = this.getLightboxValues();
    this.callEvent("onLightboxCancel", [this._lightbox_id, task.$new]);

    if (gantt.isTaskExists(task.id) && task.$new) {
      this.silent(function () {
        gantt.$data.tasksStore.removeItem(task.id);

        gantt._update_flags(task.id, null);
      });
      this.refreshData();
    }

    this.hideLightbox();
  };

  gantt._save_lightbox = function () {
    var task = this.getLightboxValues();
    if (!this.callEvent("onLightboxSave", [this._lightbox_id, task, !!task.$new])) return; // GS-2170. Do not recalculate the indexes and dates of other tasks
    // as they will be recalculated in the `refreshData`

    gantt.$data.tasksStore._skipTaskRecalculation = "lightbox";

    if (task.$new) {
      delete task.$new;
      this.addTask(task, task.parent, this.getTaskIndex(task.id));
    } else if (this.isTaskExists(task.id)) {
      this.mixin(this.getTask(task.id), task, true);
      this.refreshTask(task.id);
      this.updateTask(task.id);
    }

    gantt.$data.tasksStore._skipTaskRecalculation = false;
    this.refreshData(); // TODO: do we need any blockable events here to prevent closing lightbox?

    this.hideLightbox();
  };

  gantt._resolve_default_mapping = function (section) {
    var mapping = section.map_to;
    var time_controls = {
      "time": true,
      "time_optional": true,
      "duration": true,
      "duration_optional": true
    };

    if (time_controls[section.type]) {
      if (section.map_to == "auto") {
        mapping = {
          start_date: "start_date",
          end_date: "end_date",
          duration: "duration"
        };
      } else if (typeof section.map_to === "string") {
        mapping = {
          start_date: section.map_to
        };
      }
    } else if (section.type === "constraint") {
      if (!section.map_to || typeof section.map_to === "string") {
        mapping = {
          constraint_type: "constraint_type",
          constraint_date: "constraint_date"
        };
      }
    }

    return mapping;
  };

  gantt.getLightboxValues = function () {
    var task = {};

    if (gantt.isTaskExists(this._lightbox_id)) {
      task = this.mixin({}, this.getTask(this._lightbox_id));
    }

    var sns = this._get_typed_lightbox_config();

    for (var i = 0; i < sns.length; i++) {
      var node = gantt._lightbox_root.querySelector("#" + sns[i].id);

      node = node ? node.nextSibling : node;
      var block = this.form_blocks[sns[i].type];
      if (!block) continue;
      var res = block.get_value.call(this, node, task, sns[i]);

      var map_to = gantt._resolve_default_mapping(sns[i]);

      if (typeof map_to == "string" && map_to != "auto") {
        task[map_to] = res;
      } else if (_typeof(map_to) == "object") {
        for (var property in map_to) {
          if (map_to[property]) task[map_to[property]] = res[property];
        }
      }
    } // GS-1282 We need to preserve the task type even if the lightbox doesn't have the typeselect section


    if (gantt._lightbox_new_type == "task") {
      task.type = gantt.config.types.task;
      gantt._lightbox_new_type = null;
    }

    return task;
  };

  gantt.hideLightbox = function () {
    var box = this.getLightbox();
    if (box) box.style.display = "none";

    this._waiAria.lightboxHiddenAttr(box);

    this._lightbox_id = null;
    this.hideCover();
    this.callEvent("onAfterLightbox", []);
  };

  gantt.hideCover = function () {
    if (this._cover) this._cover.parentNode.removeChild(this._cover);
    this._cover = null;
  };

  gantt.resetLightbox = function () {
    if (gantt._lightbox && !gantt._custom_lightbox) gantt._lightbox.parentNode.removeChild(gantt._lightbox);
    gantt._lightbox = null;
    gantt.hideCover();
  };

  gantt._set_lightbox_values = function (data, box) {
    var task = data;
    var s = box.getElementsByTagName("span");
    var lightboxHeader = [];

    if (gantt.templates.lightbox_header) {
      lightboxHeader.push("");
      lightboxHeader.push(gantt.templates.lightbox_header(task.start_date, task.end_date, task));
      s[1].innerHTML = "";
      s[2].innerHTML = gantt.templates.lightbox_header(task.start_date, task.end_date, task);
    } else {
      lightboxHeader.push(this.templates.task_time(task.start_date, task.end_date, task));
      lightboxHeader.push(String(this.templates.task_text(task.start_date, task.end_date, task) || "").substr(0, 70)); //IE6 fix

      s[1].innerHTML = this.templates.task_time(task.start_date, task.end_date, task);
      s[2].innerHTML = String(this.templates.task_text(task.start_date, task.end_date, task) || "").substr(0, 70); //IE6 fix
    }

    s[1].innerHTML = lightboxHeader[0];
    s[2].innerHTML = lightboxHeader[1];

    gantt._waiAria.lightboxHeader(box, lightboxHeader.join(" "));

    var sns = this._get_typed_lightbox_config(this.getLightboxType());

    for (var i = 0; i < sns.length; i++) {
      var section = sns[i];

      if (!this.form_blocks[section.type]) {
        continue; //skip incorrect sections, same check is done during rendering
      }

      var node = gantt._lightbox_root.querySelector("#" + section.id).nextSibling;

      var block = this.form_blocks[section.type];

      var map_to = gantt._resolve_default_mapping(sns[i]);

      var value = this.defined(task[map_to]) ? task[map_to] : section.default_value;
      block.set_value.call(gantt, node, value, task, section);
      if (section.focus) block.focus.call(gantt, node);
    }

    if (gantt.isTaskExists(data.id)) {
      gantt._lightbox_id = data.id;
    }
  };

  gantt._fill_lightbox = function (id, box) {
    var task = this.getTask(id);

    this._set_lightbox_values(task, box);
  };

  gantt.getLightboxSection = function (name) {
    var config = this._get_typed_lightbox_config();

    var i = 0;

    for (i; i < config.length; i++) {
      if (config[i].name == name) break;
    }

    var section = config[i];
    if (!section) return null;
    if (!this._lightbox) this.getLightbox();

    var header = gantt._lightbox_root.querySelector("#" + section.id);

    var node = header.nextSibling;
    var result = {
      section: section,
      header: header,
      node: node,
      getValue: function getValue(ev) {
        return gantt.form_blocks[section.type].get_value.call(gantt, node, ev || {}, section);
      },
      setValue: function setValue(value, ev) {
        return gantt.form_blocks[section.type].set_value.call(gantt, node, value, ev || {}, section);
      }
    };
    var handler = this._lightbox_methods["get_" + section.type + "_control"];
    return handler ? handler(result) : result;
  };

  gantt._lightbox_methods.get_template_control = function (result) {
    result.control = result.node;
    return result;
  };

  gantt._lightbox_methods.get_select_control = function (result) {
    result.control = result.node.getElementsByTagName("select")[0];
    return result;
  };

  gantt._lightbox_methods.get_textarea_control = function (result) {
    result.control = result.node.getElementsByTagName("textarea")[0];
    return result;
  };

  gantt._lightbox_methods.get_time_control = function (result) {
    result.control = result.node.getElementsByTagName("select"); // array

    return result;
  };

  gantt._init_dnd_events = function () {
    var eventElement = gantt._lightbox_root;
    this.event(eventElement, "mousemove", gantt._move_while_dnd);
    this.event(eventElement, "mouseup", gantt._finish_dnd); // GS-1952: In Salesforce environment, the lightbox is attached to the Gantt container. 
    // So when Gantt is reinitialized, the events are no longer attached to the Gantt container.
    // gantt._init_dnd_events = function () {
    // };
  };

  gantt._move_while_dnd = function (event) {
    if (gantt._dnd_start_lb) {
      if (!document.gantt_unselectable) {
        gantt._lightbox_root.className += " gantt_unselectable";
        document.gantt_unselectable = true;
      }

      var lb = gantt.getLightbox();
      var now = [event.pageX, event.pageY];
      lb.style.top = gantt._lb_start[1] + now[1] - gantt._dnd_start_lb[1] + "px";
      lb.style.left = gantt._lb_start[0] + now[0] - gantt._dnd_start_lb[0] + "px";
    }
  };

  gantt._ready_to_dnd = function (event) {
    var lb = gantt.getLightbox();
    gantt._lb_start = [parseInt(lb.style.left, 10), parseInt(lb.style.top, 10)];
    gantt._dnd_start_lb = [event.pageX, event.pageY];
  };

  gantt._finish_dnd = function () {
    if (gantt._lb_start) {
      gantt._lb_start = gantt._dnd_start_lb = false;
      gantt._lightbox_root.className = gantt._lightbox_root.className.replace(" gantt_unselectable", "");
      document.gantt_unselectable = false;
    }
  };

  gantt._focus = function (node, select) {
    if (node && node.focus) {
      if (gantt.config.touch) {//do not focus editor, to prevent auto-zoom
      } else {
        try {
          if (select && node.select) node.select();
          node.focus();
        } catch (e) {// silent errors
        }
      }
    }
  };

  gantt.form_blocks = {
    getTimePicker: function getTimePicker(sns, hidden) {
      var html = "";
      var cfg = this.config;
      var i;
      var options;
      var ariaAttrs;
      var readonly;
      var display;
      var settings = {
        first: 0,
        last: 24 * 60,
        date: this.date.date_part(new Date(gantt._min_date.valueOf())),
        timeFormat: getTimeFormat(sns)
      }; // map: default order => real one

      sns._time_format_order = {
        size: 0
      };

      if (gantt.config.limit_time_select) {
        settings.first = 60 * cfg.first_hour;
        settings.last = 60 * cfg.last_hour + 1;
        settings.date.setHours(cfg.first_hour);
      }

      for (i = 0; i < settings.timeFormat.length; i++) {
        // adding spaces between selects
        if (i > 0) {
          html += " ";
        }

        options = getHtmlTimePickerOptions(sns, i, settings);

        if (options) {
          ariaAttrs = gantt._waiAria.lightboxSelectAttrString(settings.timeFormat[i]);
          readonly = sns.readonly ? "disabled='disabled'" : "";
          display = hidden ? " style='display:none' " : "";
          html += "<select " + readonly + display + ariaAttrs + ">" + options + "</select>";
        }
      }

      return html;
    },
    getTimePickerValue: function getTimePickerValue(selects, config, offset) {
      var map = config._time_format_order;
      var needSetTime = gantt.defined(map[3]);
      var time;
      var hours = 0;
      var minutes = 0;
      var mapOffset = offset || 0;

      if (needSetTime) {
        time = parseInt(selects[map[3] + mapOffset].value, 10);
        hours = Math.floor(time / 60);
        minutes = time % 60;
      }

      return new Date(selects[map[2] + mapOffset].value, selects[map[1] + mapOffset].value, selects[map[0] + mapOffset].value, hours, minutes);
    },
    _fill_lightbox_select: function _fill_lightbox_select(s, i, d, map) {
      s[i + map[0]].value = d.getDate();
      s[i + map[1]].value = d.getMonth();
      s[i + map[2]].value = d.getFullYear();

      if (gantt.defined(map[3])) {
        var v = d.getHours() * 60 + d.getMinutes();
        v = Math.round(v / gantt._get_timepicker_step()) * gantt._get_timepicker_step();
        var input = s[i + map[3]];
        input.value = v; //in case option not shown

        input.setAttribute("data-value", v);
      }
    },
    template: new TemplateControl(),
    textarea: new TextareaControl(),
    select: new SelectControl(),
    time: new TimeControl(),
    duration: new DurationControl(),
    parent: new ParentControl(),
    radio: new RadioControl(),
    checkbox: new CheckboxControl(),
    resources: new ResourcesControl(),
    constraint: new ConstraintControl(),
    typeselect: new TypeselectControl()
  };

  gantt._is_lightbox_timepicker = function () {
    var s = this._get_typed_lightbox_config();

    for (var i = 0; i < s.length; i++) {
      if (s[i].name == "time" && s[i].type == "time") return true;
    }

    return false;
  };

  gantt._simple_confirm = function (message, title, callback, ok) {
    if (!message) return callback();
    var opts = {
      text: message
    };
    if (title) opts.title = title;

    if (ok) {
      opts.ok = ok;
    }

    if (callback) {
      opts.callback = function (result) {
        if (result) callback();
      };
    }

    gantt.confirm(opts);
  };

  function _get_type_name(type_value) {
    for (var i in this.config.types) {
      if (this.config.types[i] == type_value) {
        return i;
      }
    }

    return "task";
  }

  gantt._get_typed_lightbox_config = function (type) {
    if (type === undefined) {
      type = this.getLightboxType();
    }

    var field = _get_type_name.call(this, type);

    if (gantt.config.lightbox[field + "_sections"]) {
      return gantt.config.lightbox[field + "_sections"];
    } else {
      return gantt.config.lightbox.sections;
    }
  };

  gantt._silent_redraw_lightbox = function (type) {
    var oldType = this.getLightboxType();

    if (this.getState().lightbox) {
      var taskId = this.getState().lightbox;
      var formData = this.getLightboxValues(),
          task = this.copy(this.getTask(taskId));
      this.resetLightbox();
      var updTask = this.mixin(task, formData, true);
      var box = this.getLightbox(type ? type : undefined);

      this._center_lightbox(this.getLightbox());

      this._set_lightbox_values(updTask, box);

      this.showCover();
    } else {
      this.resetLightbox();
      this.getLightbox(type ? type : undefined);
    }

    this.callEvent("onLightboxChange", [oldType, this.getLightboxType()]);
  };

  function bindLabelsToInputs(sns) {
    var section;
    var label;
    var labelBlock;
    var inputBlock;
    var input;
    var i;

    for (i = 0; i < sns.length; i++) {
      section = sns[i];
      labelBlock = gantt._lightbox_root.querySelector("#" + section.id);
      if (!section.id || !labelBlock) continue;
      label = labelBlock.querySelector("label");
      inputBlock = labelBlock.nextSibling;
      if (!inputBlock) continue;
      input = inputBlock.querySelector("input, select, textarea");

      if (input) {
        input.id = input.id || "input_" + gantt.uid();
        section.inputId = input.id;
        label.setAttribute("for", section.inputId);
      }
    }
  }

  function getHtmlButtons(buttons, floatRight) {
    var button;
    var ariaAttr;
    var html = "";
    var i;

    for (i = 0; i < buttons.length; i++) {
      // needed to migrate from 'dhx_something' to 'gantt_something' naming in a lightbox
      button = gantt.config._migrate_buttons[buttons[i]] ? gantt.config._migrate_buttons[buttons[i]] : buttons[i];
      ariaAttr = gantt._waiAria.lightboxButtonAttrString(button);
      html += "<div " + ariaAttr + " class='gantt_btn_set gantt_left_btn_set " + button + "_set'" + (floatRight ? " style='float:right;'" : "") + "><div dhx_button='1' data-dhx-button='1' class='" + button + "'></div><div>" + gantt.locale.labels[button] + "</div></div>";
    }

    return html;
  }

  function getTimeFormat(sns) {
    var scale;
    var unit;
    var result;
    if (sns.time_format) return sns.time_format; // default order

    result = ["%d", "%m", "%Y"];
    scale = gantt.getScale();
    unit = scale ? scale.unit : gantt.config.duration_unit;

    if (helpers.getSecondsInUnit(unit) < helpers.getSecondsInUnit("day")) {
      result.push("%H:%i");
    }

    return result;
  }

  function getHtmlTimePickerOptions(sns, index, settings) {
    var range;
    var offset;
    var start_year;
    var end_year;
    var i;
    var time;
    var diff;
    var tdate;
    var html = "";

    switch (settings.timeFormat[index]) {
      case "%Y":
        sns._time_format_order[2] = index;
        sns._time_format_order.size++; //year

        if (sns.year_range) {
          if (!isNaN(sns.year_range)) {
            range = sns.year_range;
          } else if (sns.year_range.push) {
            // if
            start_year = sns.year_range[0];
            end_year = sns.year_range[1];
          }
        }

        range = range || 10;
        offset = offset || Math.floor(range / 2);
        start_year = start_year || settings.date.getFullYear() - offset;
        end_year = end_year || gantt.getState().max_date.getFullYear() + offset;

        for (i = start_year; i < end_year; i++) {
          html += "<option value='" + i + "'>" + i + "</option>";
        }

        break;

      case "%m":
        sns._time_format_order[1] = index;
        sns._time_format_order.size++; //month

        for (i = 0; i < 12; i++) {
          html += "<option value='" + i + "'>" + gantt.locale.date.month_full[i] + "</option>";
        }

        break;

      case "%d":
        sns._time_format_order[0] = index;
        sns._time_format_order.size++; //days

        for (i = 1; i < 32; i++) {
          html += "<option value='" + i + "'>" + i + "</option>";
        }

        break;

      case "%H:%i":
        //  var last = 24*60, first = 0;
        sns._time_format_order[3] = index;
        sns._time_format_order.size++; //hours

        i = settings.first;
        tdate = settings.date.getDate();
        sns._time_values = [];

        while (i < settings.last) {
          time = gantt.templates.time_picker(settings.date);
          html += "<option value='" + i + "'>" + time + "</option>";

          sns._time_values.push(i);

          settings.date.setTime(settings.date.valueOf() + gantt._get_timepicker_step() * 60 * 1000);
          diff = settings.date.getDate() != tdate ? 1 : 0; // moved or not to the next day

          i = diff * 24 * 60 + settings.date.getHours() * 60 + settings.date.getMinutes();
        }

        break;

      default:
        break;
    }

    return html;
  }
};