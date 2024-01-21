module.exports = function (gantt) {
  var resourceAssignmentsProperty = "$resourceAssignments";
  gantt.config.resource_assignment_store = "resourceAssignments";
  gantt.config.process_resource_assignments = true;
  var resourceAssignmentFormats = {
    auto: "auto",
    singleValue: "singleValue",
    valueArray: "valueArray",
    resourceValueArray: "resourceValueArray",
    assignmentsArray: "assignmentsArray"
  };
  var resourceAssignmentFormat = resourceAssignmentFormats.auto; //"primitiveSingle";//"primitive";//"object"|"assignment"

  var assignmentModes = {
    fixedDates: "fixedDates",
    fixedDuration: "fixedDuration",
    "default": "default"
  };

  function initAssignmentFields(item, task) {
    if (item.start_date) {
      item.start_date = gantt.date.parseDate(item.start_date, "parse_date");
    } else {
      item.start_date = null;
    }

    if (item.end_date) {
      item.end_date = gantt.date.parseDate(item.end_date, "parse_date");
    } else {
      item.end_date = null;
    }

    var delay = Number(item.delay);
    var initDelay = false;

    if (!isNaN(delay)) {
      item.delay = delay;
    } else {
      item.delay = 0;
      initDelay = true;
    }

    if (!gantt.defined(item.value)) {
      item.value = null;
    }

    if (!item.task_id || !item.resource_id) {
      return false;
    }

    item.mode = item.mode || assignmentModes["default"];

    if (item.mode === assignmentModes.fixedDuration) {
      if (isNaN(Number(item.duration))) {
        task = task || gantt.getTask(item.task_id);
        item.duration = gantt.calculateDuration({
          start_date: item.start_date,
          end_date: item.end_date,
          id: task
        });
      }

      if (initDelay) {
        task = task || gantt.getTask(item.task_id);
        item.delay = gantt.calculateDuration({
          start_date: task.start_date,
          end_date: item.start_date,
          id: task
        });
      }
    }

    if (item.mode !== assignmentModes.fixedDates && (task || gantt.isTaskExists(item.task_id))) {
      task = task || gantt.getTask(item.task_id);

      var timing = _assignmentTimeFromTask(item, task);

      item.start_date = timing.start_date;
      item.end_date = timing.end_date;
      item.duration = timing.duration;
    }
  } // gantt init


  var resourceAssignmentsStore = gantt.createDatastore({
    name: gantt.config.resource_assignment_store,
    initItem: function initItem(item) {
      if (!item.id) {
        item.id = gantt.uid();
      }

      initAssignmentFields(item);
      return item;
    }
  });
  gantt.$data.assignmentsStore = resourceAssignmentsStore;

  function _assignmentTimeFromTask(assignment, task) {
    if (assignment.mode === assignmentModes.fixedDates) {
      return {
        start_date: assignment.start_date,
        end_date: assignment.end_date,
        duration: assignment.duration
      };
    } else {
      var start = assignment.delay ? gantt.calculateEndDate({
        start_date: task.start_date,
        duration: assignment.delay,
        task: task
      }) : new Date(task.start_date);
      var end;
      var duration;

      if (assignment.mode === assignmentModes.fixedDuration) {
        end = gantt.calculateEndDate({
          start_date: start,
          duration: assignment.duration,
          task: task
        });
        duration = assignment.duration;
      } else {
        end = new Date(task.end_date);
        duration = task.duration - assignment.delay;
      }
    }

    return {
      start_date: start,
      end_date: end,
      duration: duration
    };
  } // data loading


  function _makeAssignmentsFromTask(task) {
    var property = gantt.config.resource_property;
    var assignments = task[property];
    var resourceAssignments = [];
    var detectFormat = resourceAssignmentFormat === resourceAssignmentFormats.auto;

    if (gantt.defined(assignments) && assignments) {
      if (!Array.isArray(assignments)) {
        assignments = [assignments];

        if (detectFormat) {
          resourceAssignmentFormat = resourceAssignmentFormats.singleValue;
          detectFormat = false;
        }
      }

      var usedIds = {};
      assignments.forEach(function (res) {
        if (!res.resource_id) {
          // when resource is a string/number
          res = {
            resource_id: res
          };

          if (detectFormat) {
            resourceAssignmentFormat = resourceAssignmentFormats.valueArray;
            detectFormat = false;
          } //	isSimpleArray = true;

        }

        if (detectFormat) {
          if (res.id && res.resource_id) {
            resourceAssignmentFormat = resourceAssignmentFormats.assignmentsArray;
            detectFormat = false;
          } else {
            resourceAssignmentFormat = resourceAssignmentFormats.resourceValueArray;
            detectFormat = false;
          }
        }

        var defaultMode = assignmentModes["default"];

        if (!res.mode) {
          if (res.start_date && res.end_date || res.start_date && res.duration) {
            defaultMode = assignmentModes.fixedDuration;
          }
        }

        var id;

        if (!res.id && res.$id && !usedIds[res.$id]) {
          id = res.$id;
        } else if (res.id && !usedIds[res.id]) {
          id = res.id;
        } else {
          id = gantt.uid();
        }

        usedIds[id] = true;
        var assignment = {
          id: id,
          start_date: res.start_date,
          duration: res.duration,
          end_date: res.end_date,
          delay: res.delay,
          task_id: task.id,
          resource_id: res.resource_id,
          value: res.value,
          mode: res.mode || defaultMode
        };

        if (!(assignment.start_date && assignment.start_date.getMonth && assignment.end_date && assignment.end_date.getMonth && typeof assignment.duration === "number")) {
          initAssignmentFields(assignment, task);
        }

        resourceAssignments.push(assignment);
      });
    }

    return resourceAssignments;
  }

  function _updateTaskBack(taskId) {
    // GS-1493. In some cases, the resource assignment store has the tasks that no longer exist
    if (!gantt.isTaskExists(taskId)) {
      return;
    }

    var task = gantt.getTask(taskId);
    var assignments = gantt.getTaskAssignments(task.id);

    _assignAssignments(task, assignments);
  }

  function _assignAssignments(task, assignments) {
    assignments.sort(function (a, b) {
      if (a.start_date && b.start_date && a.start_date.valueOf() != b.start_date.valueOf()) {
        return a.start_date - b.start_date;
      } else {
        return 0;
      }
    });

    if (resourceAssignmentFormat == resourceAssignmentFormats.assignmentsArray) {
      task[gantt.config.resource_property] = assignments;
    } else if (resourceAssignmentFormat == resourceAssignmentFormats.resourceValueArray) {
      task[gantt.config.resource_property] = assignments.map(function (a) {
        return {
          $id: a.id,
          start_date: a.start_date,
          duration: a.duration,
          end_date: a.end_date,
          delay: a.delay,
          resource_id: a.resource_id,
          value: a.value,
          mode: a.mode
        };
      });
    }

    task[resourceAssignmentsProperty] = assignments;
  }

  function _loadAssignmentsFromTask(task) {
    var assignments = _makeAssignmentsFromTask(task);

    var taskAssignments = [];
    assignments.forEach(function (a) {
      a.id = a.id || gantt.uid(); //var newId = resourceAssignmentsStore.addItem(a);

      taskAssignments.push(a);
    });
    return assignments;
  }

  function diffAssignments(taskValues, assignmentsStoreValues) {
    var result = {
      inBoth: [],
      inTaskNotInStore: [],
      inStoreNotInTask: []
    };

    if (resourceAssignmentFormat == resourceAssignmentFormats.singleValue) {
      var taskOwner = taskValues[0];
      var ownerId = taskOwner ? taskOwner.resource_id : null;
      var foundOwnerAssignment = false;
      assignmentsStoreValues.forEach(function (a) {
        if (a.resource_id != ownerId) {
          result.inStoreNotInTask.push(a);
        } else if (a.resource_id == ownerId) {
          result.inBoth.push({
            store: a,
            task: taskOwner
          });
          foundOwnerAssignment = true;
        }
      });

      if (!foundOwnerAssignment && taskOwner) {
        result.inTaskNotInStore.push(taskOwner);
      }
    } else if (resourceAssignmentFormat == resourceAssignmentFormats.valueArray) {
      var taskSearch = {};
      var storeSearch = {};
      var processedIds = {};
      taskValues.forEach(function (a) {
        taskSearch[a.resource_id] = a;
      });
      assignmentsStoreValues.forEach(function (a) {
        storeSearch[a.resource_id] = a;
      });
      taskValues.concat(assignmentsStoreValues).forEach(function (a) {
        if (processedIds[a.resource_id]) {
          return;
        }

        processedIds[a.resource_id] = true;
        var inTask = taskSearch[a.resource_id];
        var inStore = storeSearch[a.resource_id];

        if (inTask && inStore) {
          result.inBoth.push({
            store: inStore,
            task: inTask
          });
        } else if (inTask && !inStore) {
          result.inTaskNotInStore.push(inTask);
        } else if (!inTask && inStore) {
          result.inStoreNotInTask.push(inStore);
        }
      });
    } else if (resourceAssignmentFormat == resourceAssignmentFormats.assignmentsArray || resourceAssignmentFormat == resourceAssignmentFormats.resourceValueArray) {
      var taskSearch = {};
      var storeSearch = {};
      var processedIds = {};
      taskValues.forEach(function (a) {
        taskSearch[a.id || a.$id] = a;
      });
      assignmentsStoreValues.forEach(function (a) {
        storeSearch[a.id] = a;
      });
      taskValues.concat(assignmentsStoreValues).forEach(function (a) {
        var id = a.id || a.$id;

        if (processedIds[id]) {
          return;
        }

        processedIds[id] = true;
        var inTask = taskSearch[id];
        var inStore = storeSearch[id];

        if (inTask && inStore) {
          result.inBoth.push({
            store: inStore,
            task: inTask
          });
        } else if (inTask && !inStore) {
          result.inTaskNotInStore.push(inTask);
        } else if (!inTask && inStore) {
          result.inStoreNotInTask.push(inStore);
        }
      });
    }

    return result;
  }

  function assignmentHasChanged(source, target) {
    var ignoreFields = {
      id: true
    };

    for (var i in source) {
      if (!ignoreFields[i]) {
        if (String(source[i]) !== String(target[i])) {
          return true;
        }
      }
    }

    return false;
  }

  function updateAssignment(source, target) {
    var ignoreFields = {
      id: true
    };

    for (var i in source) {
      if (!ignoreFields[i]) {
        target[i] = source[i];
      }
    }
  }

  function _syncAssignments(task, storeAssignments) {
    var tasksAssignments = _makeAssignmentsFromTask(task);

    var diff = diffAssignments(tasksAssignments, storeAssignments);
    diff.inStoreNotInTask.forEach(function (a) {
      resourceAssignmentsStore.removeItem(a.id);
    });
    diff.inTaskNotInStore.forEach(function (a) {
      resourceAssignmentsStore.addItem(a);
    });
    diff.inBoth.forEach(function (a) {
      if (assignmentHasChanged(a.task, a.store)) {
        updateAssignment(a.task, a.store);
        resourceAssignmentsStore.updateItem(a.store.id);
      } else {
        if (a.task.start_date && a.task.end_date && a.task.mode !== assignmentModes.fixedDates) {
          var timing = _assignmentTimeFromTask(a.store, task);

          if (a.store.start_date.valueOf() != timing.start_date.valueOf() || a.store.end_date.valueOf() != timing.end_date.valueOf()) {
            a.store.start_date = timing.start_date;
            a.store.end_date = timing.end_date;
            a.store.duration = timing.duration;
            resourceAssignmentsStore.updateItem(a.store.id);
          }
        }
      }
    });

    _updateTaskBack(task.id);
  }

  function _syncOnTaskUpdate(task) {
    var storeAssignments = task[resourceAssignmentsProperty] || resourceAssignmentsStore.find(function (a) {
      return a.task_id == task.id;
    });

    _syncAssignments(task, storeAssignments);
  }

  function _syncOnTaskDelete(ids) {
    var idsSearch = {};
    ids.forEach(function (id) {
      idsSearch[id] = true;
    });
    var taskResources = resourceAssignmentsStore.find(function (a) {
      return idsSearch[a.task_id];
    });
    taskResources.forEach(function (a) {
      resourceAssignmentsStore.removeItem(a.id);
    });
  }

  gantt.attachEvent("onGanttReady", function () {
    if (gantt.config.process_resource_assignments) {
      gantt.attachEvent("onParse", function () {
        gantt.silent(function () {
          resourceAssignmentsStore.clearAll();
          var totalAssignments = [];
          gantt.eachTask(function (task) {
            if (task.type === gantt.config.types.project) {
              return;
            }

            var assignments = _loadAssignmentsFromTask(task);

            _assignAssignments(task, assignments);

            assignments.forEach(function (a) {
              totalAssignments.push(a);
            });
          });
          resourceAssignmentsStore.parse(totalAssignments);
        });
      });
      var batchUpdate = false;
      var needUpdate = false;
      var needUpdateFor = {};
      var undoBatchCancel = false;
      gantt.attachEvent("onBeforeBatchUpdate", function () {
        batchUpdate = true;
      });
      gantt.attachEvent("onAfterBatchUpdate", function () {
        if (needUpdate) {
          var assignmentsHash = {};

          for (var i in needUpdateFor) {
            assignmentsHash[i] = gantt.getTaskAssignments(needUpdateFor[i].id);
          }

          for (var i in needUpdateFor) {
            _syncAssignments(needUpdateFor[i], assignmentsHash[i]);
          }
        }

        needUpdate = false;
        batchUpdate = false;
        needUpdateFor = {};
      });
      gantt.attachEvent("onTaskCreated", function (item) {
        var assignments = _loadAssignmentsFromTask(item);

        resourceAssignmentsStore.parse(assignments);

        _assignAssignments(item, assignments);

        return true;
      });
      gantt.attachEvent("onAfterTaskUpdate", function (id, item) {
        if (batchUpdate) {
          needUpdate = true;
          needUpdateFor[id] = item;
        } else {
          _syncOnTaskUpdate(item);
        }
      });
      gantt.attachEvent("onAfterTaskAdd", function (id, item) {
        if (batchUpdate) {
          needUpdate = true;
          needUpdateFor[id] = item;
        } else {
          _syncOnTaskUpdate(item);
        }
      });
      /*	gantt.attachEvent("onRowDragMove", function (id) {
      		_syncOnTaskUpdate(gantt.getTask(id));
      	});*/

      gantt.attachEvent("onRowDragEnd", function (id) {
        _syncOnTaskUpdate(gantt.getTask(id));
      });
      gantt.$data.tasksStore.attachEvent("onAfterDeleteConfirmed", function (id, item) {
        var deleteIds = [id];
        gantt.eachTask(function (task) {
          deleteIds.push(task.id);
        }, id);

        _syncOnTaskDelete(deleteIds);
      });
      gantt.$data.tasksStore.attachEvent("onClearAll", function () {
        resourceAssignmentsCache = null;
        resourceTaskAssignmentsCache = null;
        taskAssignmentsCache = null;
        resourceAssignmentsStore.clearAll();
        return true;
      });
      gantt.attachEvent("onTaskIdChange", function (id, new_id) {
        var taskResources = resourceAssignmentsStore.find(function (a) {
          return a.task_id == id;
        });
        taskResources.forEach(function (a) {
          a.task_id = new_id;
          resourceAssignmentsStore.updateItem(a.id);
        });

        _updateTaskBack(new_id); //any custom logic here

      }); // GS-2144. When we Undo something, the cache should be reset
      // during the `onStoreUpdated` event to properly update the assignments

      gantt.attachEvent("onBeforeUndo", function (action) {
        undoBatchCancel = true;
        return true;
      });
      gantt.attachEvent("onAfterUndo", function (action) {
        undoBatchCancel = true;
      });
      var resourceAssignmentsCache = null;
      var resourceTaskAssignmentsCache = null;
      var taskAssignmentsCache = null;
      resourceAssignmentsStore.attachEvent("onStoreUpdated", function resetCache() {
        if (batchUpdate && !undoBatchCancel) {
          return true;
        }

        resourceAssignmentsCache = null;
        resourceTaskAssignmentsCache = null;
        taskAssignmentsCache = null;
        return true;
      });

      gantt.getResourceAssignments = function (resourceId, taskId) {
        var searchTaskId = gantt.defined(taskId) && taskId !== null;

        if (resourceAssignmentsCache === null) {
          resourceAssignmentsCache = {};
          resourceTaskAssignmentsCache = {};
          resourceAssignmentsStore.eachItem(function (a) {
            if (!resourceAssignmentsCache[a.resource_id]) {
              resourceAssignmentsCache[a.resource_id] = [];
            }

            resourceAssignmentsCache[a.resource_id].push(a);
            var resourceTaskCacheKey = a.resource_id + "-" + a.task_id;

            if (!resourceTaskAssignmentsCache[resourceTaskCacheKey]) {
              resourceTaskAssignmentsCache[resourceTaskCacheKey] = [];
            }

            resourceTaskAssignmentsCache[resourceTaskCacheKey].push(a);
          });
        }

        if (searchTaskId) {
          return (resourceTaskAssignmentsCache[resourceId + "-" + taskId] || []).slice();
        } else {
          return (resourceAssignmentsCache[resourceId] || []).slice();
        }
      };

      gantt.getTaskAssignments = function (taskId) {
        if (taskAssignmentsCache === null) {
          var result = [];
          taskAssignmentsCache = {};
          resourceAssignmentsStore.eachItem(function (a) {
            if (!taskAssignmentsCache[a.task_id]) {
              taskAssignmentsCache[a.task_id] = [];
            }

            taskAssignmentsCache[a.task_id].push(a);

            if (a.task_id == taskId) {
              result.push(a);
            }
          });
        }

        return (taskAssignmentsCache[taskId] || []).slice();
      };

      gantt.getTaskResources = function (taskId) {
        var store = gantt.getDatastore("resource");
        var assignments = gantt.getTaskAssignments(taskId);
        var uniqueResources = {};
        assignments.forEach(function (a) {
          if (!uniqueResources[a.resource_id]) {
            uniqueResources[a.resource_id] = a.resource_id;
          }
        });
        var resources = [];

        for (var i in uniqueResources) {
          var res = store.getItem(uniqueResources[i]);

          if (res) {
            resources.push(res);
          }
        }

        return resources;
      };

      gantt.updateTaskAssignments = _updateTaskBack;
    }
  }, {
    once: true
  });
};