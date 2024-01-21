var helpers = require("../../utils/helpers");

function createResourceMethods(gantt) {
  var resourceTaskCache = {};
  var singleResourceCacheBuilt = false;
  gantt.$data.tasksStore.attachEvent("onStoreUpdated", function () {
    resourceTaskCache = {};
    singleResourceCacheBuilt = false;
  });
  gantt.attachEvent("onBeforeGanttRender", function () {
    resourceTaskCache = {};
  });

  function getTaskBy(propertyName, propertyValue, typeFilter) {
    if (typeof propertyName == "function") {
      return filterResourceTasks(propertyName);
    } else {
      if (helpers.isArray(propertyValue)) {
        return getResourceTasks(propertyName, propertyValue, typeFilter);
      } else {
        return getResourceTasks(propertyName, [propertyValue], typeFilter);
      }
    }
  }

  function filterResourceTasks(filter) {
    var res = [];
    gantt.eachTask(function (task) {
      if (filter(task)) {
        res.push(task);
      }
    });
    return res;
  }

  var falsyValuePrefix = String(Math.random());

  function resourceHashFunction(value) {
    if (value === null) {
      return falsyValuePrefix + String(value);
    }

    return String(value);
  }

  function getCacheKey(resourceIds, property, typeFilter) {
    if (Array.isArray(resourceIds)) {
      return resourceIds.map(function (value) {
        return resourceHashFunction(value);
      }).join("_") + "_".concat(property, "_").concat(typeFilter);
    } else {
      return resourceHashFunction(resourceIds) + "_".concat(property, "_").concat(typeFilter);
    }
  }

  function getResourceTasks(property, resourceIds, typeFilter) {
    var res;
    var cacheKey = getCacheKey(resourceIds, property, JSON.stringify(typeFilter));
    var matchingResources = {};
    helpers.forEach(resourceIds, function (resourceId) {
      matchingResources[resourceHashFunction(resourceId)] = true;
    });

    if (!resourceTaskCache[cacheKey]) {
      res = resourceTaskCache[cacheKey] = [];
      gantt.eachTask(function (task) {
        if (typeFilter) {
          if (!typeFilter[gantt.getTaskType(task)]) {
            return;
          }
        } else if (task.type == gantt.config.types.project) {
          return;
        }

        if (property in task) {
          var resourceValue;

          if (!helpers.isArray(task[property])) {
            resourceValue = [task[property]];
          } else {
            resourceValue = task[property];
          }

          helpers.forEach(resourceValue, function (value) {
            var resourceValue = value && value.resource_id ? value.resource_id : value;

            if (matchingResources[resourceHashFunction(resourceValue)]) {
              res.push(task);
            } else if (!singleResourceCacheBuilt) {
              var key = getCacheKey(value, property);

              if (!resourceTaskCache[key]) {
                resourceTaskCache[key] = [];
              }

              resourceTaskCache[key].push(task);
            }
          });
        }
      });
      singleResourceCacheBuilt = true;
    } else {
      res = resourceTaskCache[cacheKey];
    }

    return res;
  }

  function selectAssignments(resourceId, taskId, result) {
    var property = gantt.config.resource_property;
    var owners = [];

    if (gantt.getDatastore("task").exists(taskId)) {
      var task = gantt.getTask(taskId);
      owners = task[property] || [];
    }

    if (!Array.isArray(owners)) {
      owners = [owners];
    }

    for (var i = 0; i < owners.length; i++) {
      if (owners[i].resource_id == resourceId) {
        result.push({
          task_id: task.id,
          resource_id: owners[i].resource_id,
          value: owners[i].value
        });
      }
    }
  }

  function getResourceAssignments(resourceId, taskId) {
    // resource assignment as an independent module:
    // {taskId:, resourceId, value}
    // TODO: probably should add a separate datastore for these
    var assignments = [];
    var property = gantt.config.resource_property;

    if (taskId !== undefined) {
      selectAssignments(resourceId, taskId, assignments);
    } else {
      var tasks = gantt.getTaskBy(property, resourceId);
      tasks.forEach(function (task) {
        selectAssignments(resourceId, task.id, assignments);
      });
    }

    return assignments;
  }

  return {
    getTaskBy: getTaskBy,
    getResourceAssignments: getResourceAssignments
  };
}

function createHelper(gantt) {
  var resourcePlugin = {
    renderEditableLabel: function renderEditableLabel(start_date, end_date, resource, tasks, assignments) {
      var editable = gantt.config.readonly ? "" : "contenteditable";

      if (start_date < resource.end_date && end_date > resource.start_date) {
        for (var i = 0; i < assignments.length; i++) {
          var a = assignments[i];
          return "<div " + editable + " data-assignment-cell data-assignment-id='" + a.id + "'" + " data-row-id='" + resource.id + "'" + " data-task='" + resource.$task_id + "'" + " data-start-date='" + gantt.templates.format_date(start_date) + "'" + " data-end-date='" + gantt.templates.format_date(end_date) + "'>" + a.value + "</div>";
        }

        return "<div " + editable + " data-assignment-cell data-empty " + " data-row-id='" + resource.id + "'" + " data-resource-id='" + resource.$resource_id + "'" + " data-task='" + resource.$task_id + "'" + " data-start-date='" + gantt.templates.format_date(start_date) + "'" + "'  data-end-date='" + gantt.templates.format_date(end_date) + "'>-</div>";
      }

      return "";
    },
    renderSummaryLabel: function renderSummaryLabel(start_date, end_date, resource, tasks, assignments) {
      var sum = assignments.reduce(function (total, assignment) {
        return total + Number(assignment.value);
      }, 0);

      if (sum % 1) {
        sum = Math.round(sum * 10) / 10;
      }

      if (sum) {
        return "<div>" + sum + "</div>";
      }

      return "";
    },
    editableResourceCellTemplate: function editableResourceCellTemplate(start_date, end_date, resource, tasks, assignments) {
      if (resource.$role === "task") {
        return resourcePlugin.renderEditableLabel(start_date, end_date, resource, tasks, assignments);
      } else {
        return resourcePlugin.renderSummaryLabel(start_date, end_date, resource, tasks, assignments);
      }
    },
    editableResourceCellClass: function editableResourceCellClass(start_date, end_date, resource, tasks, assignments) {
      var css = [];
      css.push("resource_marker");

      if (resource.$role === "task") {
        css.push("task_cell");
      } else {
        css.push("resource_cell");
      }

      var sum = assignments.reduce(function (total, assignment) {
        return total + Number(assignment.value);
      }, 0);
      var capacity = Number(resource.capacity);

      if (isNaN(capacity)) {
        capacity = 8;
      }

      if (sum <= capacity) {
        css.push("workday_ok");
      } else {
        css.push("workday_over");
      }

      return css.join(" ");
    },
    getSummaryResourceAssignments: function getResourceAssignments(resourceId) {
      var assignments;
      var store = gantt.getDatastore(gantt.config.resource_store);
      var resource = store.getItem(resourceId);

      if (resource.$role === "task") {
        assignments = gantt.getResourceAssignments(resource.$resource_id, resource.$task_id);
      } else {
        assignments = gantt.getResourceAssignments(resourceId);

        if (store.eachItem) {
          store.eachItem(function (childResource) {
            if (childResource.$role !== "task") {
              assignments = assignments.concat(gantt.getResourceAssignments(childResource.id));
            }
          }, resourceId);
        }
      }

      return assignments;
    },
    initEditableDiagram: function initEditableDiagram() {
      gantt.config.resource_render_empty_cells = true;

      (function () {
        /// salesforce locker workaround
        // SF removes 'contenteditable' attribute from cells
        // restore it on render
        var timeoutId = null;

        function makeEditable() {
          if (timeoutId) {
            cancelAnimationFrame(timeoutId);
          }

          timeoutId = requestAnimationFrame(function () {
            var cells = Array.prototype.slice.call(gantt.$container.querySelectorAll(".resourceTimeline_cell [data-assignment-cell]"));
            cells.forEach(function (cell) {
              cell.contentEditable = true;
            });
          });
          return true;
        }

        gantt.attachEvent("onGanttReady", function () {
          gantt.getDatastore(gantt.config.resource_assignment_store).attachEvent("onStoreUpdated", makeEditable);
          gantt.getDatastore(gantt.config.resource_store).attachEvent("onStoreUpdated", makeEditable);
        }, {
          once: true
        });
        gantt.attachEvent("onGanttLayoutReady", function () {
          var ganttViews = gantt.$layout.getCellsByType("viewCell");
          ganttViews.forEach(function (view) {
            if (view.$config && view.$config.view === "resourceTimeline" && view.$content) {
              view.$content.attachEvent("onScroll", makeEditable);
            }
          });
        });
      })();

      gantt.attachEvent("onGanttReady", function () {
        var assignmentEditInProcess = false;
        gantt.event(gantt.$container, "keypress", function (e) {
          var target = e.target.closest(".resourceTimeline_cell [data-assignment-cell]");

          if (target) {
            if (e.keyCode === 13 || e.keyCode === 27) {
              target.blur();
            }
          }
        });
        gantt.event(gantt.$container, "focusout", function (e) {
          if (assignmentEditInProcess) {
            return;
          }

          assignmentEditInProcess = true;
          setTimeout(function () {
            assignmentEditInProcess = false;
          }, 300);
          var target = e.target.closest(".resourceTimeline_cell [data-assignment-cell]");

          if (target) {
            var strValue = (target.innerText || "").trim();

            if (strValue == "-") {
              strValue = "0";
            }

            var value = Number(strValue);
            var rowId = target.getAttribute("data-row-id");
            var assignmentId = target.getAttribute("data-assignment-id");
            var taskId = target.getAttribute("data-task");
            var resourceId = target.getAttribute("data-resource-id");
            var startDate = gantt.templates.parse_date(target.getAttribute("data-start-date"));
            var endDate = gantt.templates.parse_date(target.getAttribute("data-end-date"));
            var assignmentStore = gantt.getDatastore(gantt.config.resource_assignment_store);

            if (isNaN(value)) {
              gantt.getDatastore(gantt.config.resource_store).refresh(rowId);
            } else {
              var task = gantt.getTask(taskId); // GS-2141. Track the changes by the Undo extension

              if (gantt.plugins().undo) {
                gantt.ext.undo.saveState(taskId, "task");
              }

              if (assignmentId) {
                var assignment = assignmentStore.getItem(assignmentId);

                if (value === assignment.value) {
                  return;
                }

                if (assignment.start_date.valueOf() === startDate.valueOf() && assignment.end_date.valueOf() === endDate.valueOf()) {
                  assignment.value = value;

                  if (!value) {
                    assignmentStore.removeItem(assignment.id);
                  } else {
                    assignmentStore.updateItem(assignment.id);
                  }
                } else {
                  if (assignment.end_date.valueOf() > endDate.valueOf()) {
                    var nextChunk = gantt.copy(assignment);
                    nextChunk.id = gantt.uid();
                    nextChunk.start_date = endDate;
                    nextChunk.duration = gantt.calculateDuration({
                      start_date: nextChunk.start_date,
                      end_date: nextChunk.end_date,
                      task: task
                    });
                    nextChunk.delay = gantt.calculateDuration({
                      start_date: task.start_date,
                      end_date: nextChunk.start_date,
                      task: task
                    });
                    nextChunk.mode = assignment.mode || "default";

                    if (nextChunk.duration !== 0) {
                      assignmentStore.addItem(nextChunk);
                    }
                  }

                  if (assignment.start_date.valueOf() < startDate.valueOf()) {
                    assignment.end_date = startDate;
                    assignment.duration = gantt.calculateDuration({
                      start_date: assignment.start_date,
                      end_date: assignment.end_date,
                      task: task
                    });
                    assignment.mode = "fixedDuration";

                    if (assignment.duration === 0) {
                      assignmentStore.removeItem(assignment.id);
                    } else {
                      assignmentStore.updateItem(assignment.id);
                    }
                  } else {
                    assignmentStore.removeItem(assignment.id);
                  }

                  if (value) {
                    assignmentStore.addItem({
                      task_id: assignment.task_id,
                      resource_id: assignment.resource_id,
                      value: value,
                      start_date: startDate,
                      end_date: endDate,
                      duration: gantt.calculateDuration({
                        start_date: startDate,
                        end_date: endDate,
                        task: task
                      }),
                      delay: gantt.calculateDuration({
                        start_date: task.start_date,
                        end_date: startDate,
                        task: task
                      }),
                      mode: "fixedDuration"
                    });
                  }
                }

                gantt.updateTaskAssignments(task.id);
                gantt.updateTask(task.id);
              } else if (value) {
                var assignment = {
                  task_id: taskId,
                  resource_id: resourceId,
                  value: value,
                  start_date: startDate,
                  end_date: endDate,
                  duration: gantt.calculateDuration({
                    start_date: startDate,
                    end_date: endDate,
                    task: task
                  }),
                  delay: gantt.calculateDuration({
                    start_date: task.start_date,
                    end_date: startDate,
                    task: task
                  }),
                  mode: "fixedDuration"
                };
                assignmentStore.addItem(assignment);
                gantt.updateTaskAssignments(task.id);
                gantt.updateTask(task.id);
              }
            }
          }
        });
      }, {
        once: true
      });
    }
  };
  return resourcePlugin;
}

module.exports = function (gantt) {
  var methods = createResourceMethods(gantt);
  gantt.ext.resources = createHelper(gantt);
  gantt.config.resources = {
    dataprocessor_assignments: false,
    dataprocessor_resources: false,
    editable_resource_diagram: false,
    resource_store: {
      type: "treeDataStore",
      fetchTasks: false,
      initItem: function initItem(item) {
        item.parent = item.parent || gantt.config.root_id;
        item[gantt.config.resource_property] = item.parent;
        item.open = true;
        return item;
      }
    },
    lightbox_resources: function selectResourceControlOptions(resources) {
      var lightboxOptions = [];
      var store = gantt.getDatastore(gantt.config.resource_store);
      resources.forEach(function (res) {
        if (!store.hasChild(res.id)) {
          var copy = gantt.copy(res);
          copy.key = res.id;
          copy.label = res.text;
          lightboxOptions.push(copy);
        }
      });
      return lightboxOptions;
    }
  };
  gantt.attachEvent("onBeforeGanttReady", function () {
    if (gantt.getDatastore(gantt.config.resource_store)) {
      return;
    }

    var resourceStoreConfig = gantt.config.resources ? gantt.config.resources.resource_store : undefined;
    var fetchTasks = resourceStoreConfig ? resourceStoreConfig.fetchTasks : undefined;

    if (gantt.config.resources && gantt.config.resources.editable_resource_diagram) {
      fetchTasks = true;
    }

    var initItems = function initItems(item) {
      item.parent = item.parent || gantt.config.root_id;
      item[gantt.config.resource_property] = item.parent;
      item.open = true;
      return item;
    };

    if (resourceStoreConfig && resourceStoreConfig.initItem) {
      initItems = resourceStoreConfig.initItem;
    }

    var storeType = resourceStoreConfig && resourceStoreConfig.type ? resourceStoreConfig.type : "treeDatastore";
    gantt.$resourcesStore = gantt.createDatastore({
      name: gantt.config.resource_store,
      type: storeType,
      fetchTasks: fetchTasks !== undefined ? fetchTasks : false,
      initItem: initItems
    });
    gantt.$data.resourcesStore = gantt.$resourcesStore;
    gantt.$resourcesStore.attachEvent("onParse", function () {
      function selectResourceControlOptions(resources) {
        var lightboxOptions = [];
        resources.forEach(function (res) {
          if (!gantt.$resourcesStore.hasChild(res.id)) {
            var copy = gantt.copy(res);
            copy.key = res.id;
            copy.label = res.text;
            lightboxOptions.push(copy);
          }
        });
        return lightboxOptions;
      }

      var lightboxOptionsFnc = selectResourceControlOptions;

      if (gantt.config.resources && gantt.config.resources.lightbox_resources) {
        lightboxOptionsFnc = gantt.config.resources.lightbox_resources;
      }

      var options = lightboxOptionsFnc(gantt.$resourcesStore.getItems());
      gantt.updateCollection("resourceOptions", options);
    });
  });
  gantt.getTaskBy = methods.getTaskBy;
  gantt.getResourceAssignments = methods.getResourceAssignments;
  gantt.config.resource_property = "owner_id";
  gantt.config.resource_store = "resource";
  gantt.config.resource_render_empty_cells = false;
  /**
   * these are placeholder functions that should be redefined by the user
  */

  gantt.templates.histogram_cell_class = function (start_date, end_date, resource, tasks, assignments) {};

  gantt.templates.histogram_cell_label = function (start_date, end_date, resource, tasks, assignments) {
    return tasks.length + "/3";
  };

  gantt.templates.histogram_cell_allocated = function (start_date, end_date, resource, tasks, assignments) {
    return tasks.length / 3;
  };

  gantt.templates.histogram_cell_capacity = function (start_date, end_date, resource, tasks, assignments) {
    return 0;
  };

  var defaultResourceCellClass = function defaultResourceCellClass(start, end, resource, tasks, assignments) {
    var css = "";

    if (tasks.length <= 1) {
      css = "gantt_resource_marker_ok";
    } else {
      css = "gantt_resource_marker_overtime";
    }

    return css;
  };

  var defaultResourceCellTemplate = function defaultResourceCellTemplate(start, end, resource, tasks, assignments) {
    return tasks.length * 8;
  };

  gantt.templates.resource_cell_value = defaultResourceCellTemplate;
  gantt.templates.resource_cell_class = defaultResourceCellClass; //editable_resource_diagram

  gantt.attachEvent("onBeforeGanttReady", function () {
    if (gantt.config.resources && gantt.config.resources.editable_resource_diagram) {
      gantt.config.resource_render_empty_cells = true;

      if (gantt.templates.resource_cell_value === defaultResourceCellTemplate) {
        gantt.templates.resource_cell_value = gantt.ext.resources.editableResourceCellTemplate;
      }

      if (gantt.templates.resource_cell_class === defaultResourceCellClass) {
        gantt.templates.resource_cell_class = gantt.ext.resources.editableResourceCellClass;
      }

      gantt.ext.resources.initEditableDiagram(gantt);
    }
  });
};