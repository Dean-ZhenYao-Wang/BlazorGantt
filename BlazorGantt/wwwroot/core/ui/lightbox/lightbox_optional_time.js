module.exports = function (gantt) {
  gantt._extend_to_optional = function (lightbox_block) {
    var duration = lightbox_block;
    var optional_time = {
      render: duration.render,
      focus: duration.focus,
      set_value: function set_value(node, value, task, section) {
        var mapping = gantt._resolve_default_mapping(section);

        if (!task[mapping.start_date] || mapping.start_date == "start_date" && this._isAllowedUnscheduledTask(task)) {
          optional_time.disable(node, section);
          var val = {};

          for (var i in mapping) {
            //take default values from the time control from task start/end dates
            val[mapping[i]] = task[i];
          }

          return duration.set_value.call(gantt, node, value, val, section); //set default value
        } else {
          optional_time.enable(node, section);
          return duration.set_value.call(gantt, node, value, task, section);
        }
      },
      get_value: function get_value(node, task, section) {
        if (section.disabled) {
          return {
            start_date: null
          };
        } else {
          return duration.get_value.call(gantt, node, task, section);
        }
      },
      update_block: function update_block(node, section) {
        gantt.callEvent("onSectionToggle", [gantt._lightbox_id, section]);
        node.style.display = section.disabled ? "none" : "block";

        if (section.button) {
          var button = node.previousSibling.querySelector(".gantt_custom_button_label"),
              labels = gantt.locale.labels;
          var button_text = section.disabled ? labels[section.name + "_enable_button"] : labels[section.name + "_disable_button"];
          button.innerHTML = button_text;
        }

        gantt.resizeLightbox();
      },
      disable: function disable(node, section) {
        section.disabled = true;
        optional_time.update_block(node, section);
      },
      enable: function enable(node, section) {
        section.disabled = false;
        optional_time.update_block(node, section);
      },
      button_click: function button_click(index, el, section, container) {
        if (gantt.callEvent("onSectionButton", [gantt._lightbox_id, section]) === false) {
          return;
        }

        var config = gantt._get_typed_lightbox_config()[index];

        if (config.disabled) {
          optional_time.enable(container, config);
        } else {
          optional_time.disable(container, config);
        }
      }
    };
    return optional_time;
  };

  gantt.form_blocks.duration_optional = gantt._extend_to_optional(gantt.form_blocks.duration);
  gantt.form_blocks.time_optional = gantt._extend_to_optional(gantt.form_blocks.time);
};