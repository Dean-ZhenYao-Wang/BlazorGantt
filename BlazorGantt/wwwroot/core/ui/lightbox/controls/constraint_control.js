var __extends = require("../../../../utils/extends");

var htmlHelpers = require("../../utils/html_helpers");

module.exports = function (gantt) {
  var _super = require("./base_control")(gantt);

  function ConstraintControl() {
    var self = _super.apply(this, arguments) || this;
    return self;
  }

  __extends(ConstraintControl, _super);

  function isNonTimedConstraint(value) {
    if (!value || value === gantt.config.constraint_types.ASAP || value === gantt.config.constraint_types.ALAP) {
      return true;
    } else {
      return false;
    }
  }

  function toggleTimeSelect(timeSelects, typeValue) {
    var isNonTimed = isNonTimedConstraint(typeValue);

    for (var i = 0; i < timeSelects.length; i++) {
      timeSelects[i].disabled = isNonTimed;
    }
  }

  ConstraintControl.prototype.render = function (sns) {
    var height = (sns.height || 30) + "px";
    var html = "<div class='gantt_cal_ltext gantt_section_" + sns.name + "' style='height:" + height + ";'>";
    var options = [];

    for (var i in gantt.config.constraint_types) {
      options.push({
        key: gantt.config.constraint_types[i],
        label: gantt.locale.labels[gantt.config.constraint_types[i]]
      });
    }

    sns.options = sns.options || options;
    html += "<span data-constraint-type-select>" + htmlHelpers.getHtmlSelect(sns.options, [{
      key: "data-type",
      value: "constraint-type"
    }]) + "</span>";
    var timeLabel = gantt.locale.labels["constraint_date"] || "Constraint date";
    html += "<label data-constraint-time-select>" + timeLabel + ": " + gantt.form_blocks.getTimePicker.call(this, sns) + "</label>";
    html += "</div>";
    return html;
  };

  ConstraintControl.prototype.set_value = function (node, value, task, config) {
    var typeSelect = node.querySelector("[data-constraint-type-select] select");
    var timeSelects = node.querySelectorAll("[data-constraint-time-select] select");
    var map = config._time_format_order;

    var mapping = gantt._resolve_default_mapping(config);

    if (!typeSelect._eventsInitialized) {
      typeSelect.addEventListener("change", function (e) {
        toggleTimeSelect(timeSelects, e.target.value);
      });
      typeSelect._eventsInitialized = true;
    }

    var constraintDate = task[mapping.constraint_date] || new Date();

    gantt.form_blocks._fill_lightbox_select(timeSelects, 0, constraintDate, map, config);

    var constraintType = task[mapping.constraint_type] || gantt.getConstraintType(task);
    typeSelect.value = constraintType;
    toggleTimeSelect(timeSelects, constraintType);
  };

  ConstraintControl.prototype.get_value = function (node, task, config) {
    var typeSelect = node.querySelector("[data-constraint-type-select] select");
    var timeSelects = node.querySelectorAll("[data-constraint-time-select] select");
    var constraintType = typeSelect.value;
    var constraintDate = null;

    if (!isNonTimedConstraint(constraintType)) {
      constraintDate = gantt.form_blocks.getTimePickerValue(timeSelects, config);
    }

    return {
      constraint_type: constraintType,
      constraint_date: constraintDate
    };
  };

  ConstraintControl.prototype.focus = function (node) {
    gantt._focus(node.querySelector("select"));
  };

  return ConstraintControl;
};