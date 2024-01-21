module.exports = function () {
  function getResourcesCalendarKey(resourceAssignments) {
    return resourceAssignments.map(function (res) {
      if (res && res.resource_id) {
        return res.resource_id;
      } else {
        return res;
      }
    }).sort().join("-");
  }

  var dynamicCalendars = {};

  function mergeResourceCalendars(resourceAssignments, manager) {
    return manager.mergeCalendars(resourceAssignments.map(function (assignment) {
      var resourceId = assignment && assignment.resource_id ? assignment.resource_id : assignment;
      return manager.getResourceCalendar(resourceId);
    }));
  }

  function getCalendarIdFromMultipleResources(resourceAssignments, manager) {
    var key = getResourcesCalendarKey(resourceAssignments);

    if (!resourceAssignments.length) {
      return null;
    } else if (resourceAssignments.length === 1) {
      return manager.getResourceCalendar(key).id;
    } else if (dynamicCalendars[key]) {
      return dynamicCalendars[key].id;
    } else {
      var tempCalendar = mergeResourceCalendars(resourceAssignments, manager);
      dynamicCalendars[key] = tempCalendar;
      return manager.addCalendar(tempCalendar);
    }
  }

  return {
    getCalendarIdFromMultipleResources: getCalendarIdFromMultipleResources
  };
};