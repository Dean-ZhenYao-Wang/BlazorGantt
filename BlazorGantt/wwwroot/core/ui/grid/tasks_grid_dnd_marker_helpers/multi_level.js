/**
 * resolve dnd position of the task when gantt.config.order_branch_free = true
 */
var dropTarget = require("./drop_target");

module.exports = function getMultiLevelDropPosition(dndTaskId, targetTaskId, relTargetPos, eventTop, store) {
  var result;

  if (targetTaskId !== store.$getRootId()) {
    if (relTargetPos < 0.25) {
      result = dropTarget.prevSiblingTarget(dndTaskId, targetTaskId, store);
    } else if (relTargetPos > 0.60 && !(store.hasChild(targetTaskId) && store.getItem(targetTaskId).$open)) {
      result = dropTarget.nextSiblingTarget(dndTaskId, targetTaskId, store);
    } else {
      result = dropTarget.firstChildTarget(dndTaskId, targetTaskId, store);
    }
  } else {
    var rootId = store.$getRootId();

    if (store.hasChild(rootId) && eventTop >= 0) {
      result = dropTarget.lastChildTarget(dndTaskId, rootId, store);
    } else {
      result = dropTarget.firstChildTarget(dndTaskId, rootId, store);
    }
  }

  return result;
};