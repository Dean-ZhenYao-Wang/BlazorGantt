module.exports = function addPlaceholder(gantt) {
  function isEnabled() {
    return gantt.config.placeholder_task;
  }

  function callIfEnabled(callback) {
    return function () {
      if (!isEnabled()) {
        return true;
      }

      return callback.apply(this, arguments);
    };
  }

  function silenceDataProcessor(dataProcessor) {
    if (dataProcessor && !dataProcessor._silencedPlaceholder) {
      dataProcessor._silencedPlaceholder = true;
      dataProcessor.attachEvent("onBeforeUpdate", callIfEnabled(function (id, state, data) {
        if (data.type == gantt.config.types.placeholder) {
          dataProcessor.setUpdated(id, false);
          return false;
        }

        return true;
      }));
    }
  }

  function insertPlaceholder() {
    var placeholders = gantt.getTaskBy("type", gantt.config.types.placeholder);

    if (!placeholders.length || !gantt.isTaskExists(placeholders[0].id)) {
      var placeholder = {
        unscheduled: true,
        type: gantt.config.types.placeholder,
        duration: 0,
        text: gantt.locale.labels.new_task
      };

      if (gantt.callEvent("onTaskCreated", [placeholder]) === false) {
        return;
      }

      gantt.addTask(placeholder);
    }
  }

  function afterEdit(id) {
    var item = gantt.getTask(id);

    if (item.type == gantt.config.types.placeholder) {
      if (item.start_date && item.end_date && item.unscheduled) {
        item.unscheduled = false;
      }

      gantt.batchUpdate(function () {
        var newTask = gantt.copy(item);
        gantt.silent(function () {
          gantt.deleteTask(item.id);
        });
        delete newTask["!nativeeditor_status"];
        newTask.type = gantt.config.types.task;
        newTask.id = gantt.uid();
        gantt.addTask(newTask); //insertPlaceholder();
      });
    }
  }

  gantt.config.types.placeholder = "placeholder";
  gantt.attachEvent("onDataProcessorReady", callIfEnabled(silenceDataProcessor));
  var ready = false;
  gantt.attachEvent("onGanttReady", function () {
    if (ready) {
      return;
    }

    ready = true;
    gantt.attachEvent("onAfterTaskUpdate", callIfEnabled(afterEdit));
    gantt.attachEvent("onAfterTaskAdd", callIfEnabled(function (id, task) {
      if (task.type != gantt.config.types.placeholder) {
        var placeholders = gantt.getTaskBy("type", gantt.config.types.placeholder);
        placeholders.forEach(function (p) {
          gantt.silent(function () {
            if (gantt.isTaskExists(p.id)) gantt.deleteTask(p.id);
          });
        });
        insertPlaceholder();
      }
    }));
    gantt.attachEvent("onParse", callIfEnabled(insertPlaceholder));
  });

  function isPlaceholderTask(taskId) {
    if (gantt.config.types.placeholder && gantt.isTaskExists(taskId)) {
      var task = gantt.getTask(taskId);

      if (task.type == gantt.config.types.placeholder) {
        return true;
      }
    }

    return false;
  }

  function isPlaceholderLink(link) {
    if (isPlaceholderTask(link.source) || isPlaceholderTask(link.target)) {
      return true;
    }

    return false;
  }

  gantt.attachEvent("onLinkValidation", function (link) {
    if (isPlaceholderLink(link)) {
      return false;
    }

    return true;
  });
  gantt.attachEvent("onBeforeLinkAdd", function (id, link) {
    if (isPlaceholderLink(link)) {
      return false;
    }

    return true;
  });
  gantt.attachEvent("onBeforeUndoStack", function (action) {
    for (var i = 0; i < action.commands.length; i++) {
      var command = action.commands[i];

      if (command.entity === "task" && command.value.type === gantt.config.types.placeholder) {
        action.commands.splice(i, 1);
        i--;
      }
    }

    return true;
  });
};