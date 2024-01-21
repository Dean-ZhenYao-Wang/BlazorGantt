module.exports = function (gantt) {
  var regTemplates = {};

  function initTemplate(name, initial, template_name) {
    template_name = template_name || name;
    var config = gantt.config,
        templates = gantt.templates;

    if (gantt.config[name] && regTemplates[template_name] != config[name]) {
      if (!(initial && templates[template_name])) {
        templates[template_name] = gantt.date.date_to_str(config[name]);
        regTemplates[template_name] = config[name];
      }
    }
  }

  function initTemplates() {
    var labels = gantt.locale.labels;
    labels.gantt_save_btn = labels.icon_save;
    labels.gantt_cancel_btn = labels.icon_cancel;
    labels.gantt_delete_btn = labels.icon_delete;
    var date = gantt.date; //build configuration based templates

    var d = date.date_to_str;
    var c = gantt.config;
    var format_date = d(c.xml_date || c.date_format, c.server_utc);
    var parse_date = date.str_to_date(c.xml_date || c.date_format, c.server_utc);
    initTemplate("date_scale", true, undefined, gantt.config, gantt.templates);
    initTemplate("date_grid", true, "grid_date_format", gantt.config, gantt.templates);
    initTemplate("task_date", true, undefined, gantt.config, gantt.templates);
    gantt.mixin(gantt.templates, {
      xml_format: undefined,
      // deprecated
      format_date: format_date,
      xml_date: undefined,
      // deprecated
      parse_date: parse_date,
      progress_text: function progress_text(start, end, task) {
        return "";
      },
      grid_header_class: function grid_header_class(column, config) {
        return "";
      },
      task_text: function task_text(start, end, task) {
        return task.text;
      },
      task_class: function task_class(start, end, task) {
        return "";
      },
      task_end_date: function task_end_date(date) {
        return gantt.templates.task_date(date);
      },
      grid_row_class: function grid_row_class(start, end, task) {
        return "";
      },
      task_row_class: function task_row_class(start, end, task) {
        return "";
      },
      timeline_cell_class: function timeline_cell_class(item, date) {
        return "";
      },
      timeline_cell_content: function timeline_cell_content(item, date) {
        return "";
      },
      scale_cell_class: function scale_cell_class(date) {
        return "";
      },
      scale_row_class: function scale_row_class(date) {
        return "";
      },
      grid_indent: function grid_indent(item) {
        return "<div class='gantt_tree_indent'></div>";
      },
      grid_folder: function grid_folder(item) {
        return "<div class='gantt_tree_icon gantt_folder_" + (item.$open ? "open" : "closed") + "'></div>";
      },
      grid_file: function grid_file(item) {
        return "<div class='gantt_tree_icon gantt_file'></div>";
      },
      grid_open: function grid_open(item) {
        return "<div class='gantt_tree_icon gantt_" + (item.$open ? "close" : "open") + "'></div>";
      },
      grid_blank: function grid_blank(item) {
        return "<div class='gantt_tree_icon gantt_blank'></div>";
      },
      date_grid: function date_grid(date, item, column) {
        if (item && gantt.isUnscheduledTask(item) && gantt.config.show_unscheduled) {
          return gantt.templates.task_unscheduled_time(item);
        } else {
          return gantt.templates.grid_date_format(date, column);
        }
      },
      task_time: function task_time(start, end, ev) {
        if (gantt.isUnscheduledTask(ev) && gantt.config.show_unscheduled) {
          return gantt.templates.task_unscheduled_time(ev);
        } else {
          return gantt.templates.task_date(start) + " - " + gantt.templates.task_end_date(end);
        }
      },
      task_unscheduled_time: function task_unscheduled_time(task) {
        return "";
      },
      time_picker: d(c.time_picker),
      link_class: function link_class(link) {
        return "";
      },
      link_description: function link_description(link) {
        var from = gantt.getTask(link.source),
            to = gantt.getTask(link.target);
        return "<b>" + from.text + "</b> &ndash;  <b>" + to.text + "</b>";
      },
      drag_link: function drag_link(from, from_start, to, to_start) {
        from = gantt.getTask(from);
        var labels = gantt.locale.labels;
        var text = "<b>" + from.text + "</b> " + (from_start ? labels.link_start : labels.link_end) + "<br/>";

        if (to) {
          to = gantt.getTask(to);
          text += "<b> " + to.text + "</b> " + (to_start ? labels.link_start : labels.link_end) + "<br/>";
        }

        return text;
      },
      drag_link_class: function drag_link_class(from, from_start, to, to_start) {
        var add = "";

        if (from && to) {
          var allowed = gantt.isLinkAllowed(from, to, from_start, to_start);
          add = " " + (allowed ? "gantt_link_allow" : "gantt_link_deny");
        }

        return "gantt_link_tooltip" + add;
      },

      /* used for aria-labels of bar elements and for tooltip.js */
      tooltip_date_format: date.date_to_str("%Y-%m-%d"),
      tooltip_text: function tooltip_text(start, end, event) {
        return "<b>Task:</b> " + event.text + "<br/><b>Start date:</b> " + gantt.templates.tooltip_date_format(start) + "<br/><b>End date:</b> " + gantt.templates.tooltip_date_format(end);
      }
    });
  }

  return {
    initTemplates: initTemplates,
    initTemplate: initTemplate
  };
};