/**
 * resolve dnd position of the task when gantt.config.order_branch_free = false
 */
var dropTarget = require("./drop_target");

function getLast(store) {
  var current = store.getNext();

  while (store.exists(current)) {
    var next = store.getNext(current);

    if (!store.exists(next)) {
      return current;
    } else {
      current = next;
    }
  }

  return null;
}

function findClosesTarget(dndTaskId, taskId, allowedLevel, store, up) {
  var prev = taskId;

  while (store.exists(prev)) {
    var targetLevel = store.calculateItemLevel(store.getItem(prev));

    if ((targetLevel === allowedLevel || targetLevel === allowedLevel - 1) && store.getBranchIndex(prev) > -1) {
      break;
    } else {
      prev = up ? store.getPrev(prev) : store.getNext(prev);
    }
  }

  if (store.exists(prev)) {
    if (store.calculateItemLevel(store.getItem(prev)) === allowedLevel) {
      return up ? dropTarget.nextSiblingTarget(dndTaskId, prev, store) : dropTarget.prevSiblingTarget(dndTaskId, prev, store);
    } else {
      return dropTarget.firstChildTarget(dndTaskId, prev, store);
    }
  }

  return null;
}

function findTargetAbove(dndTaskId, taskId, allowedLevel, store) {
  return findClosesTarget(dndTaskId, taskId, allowedLevel, store, true);
}

function findTargetBelow(dndTaskId, taskId, allowedLevel, store) {
  return findClosesTarget(dndTaskId, taskId, allowedLevel, store, false);
}

module.exports = function getSameLevelDropPosition(dndTaskId, targetTaskId, relTargetPos, eventTop, store, level) {
  var result;

  if (targetTaskId !== store.$getRootId()) {
    var targetTask = store.getItem(targetTaskId);
    var targetLevel = store.calculateItemLevel(targetTask);

    if (targetLevel === level) {
      var prevSibling = store.getPrevSibling(targetTaskId);

      if (relTargetPos < 0.5 && !prevSibling) {
        result = dropTarget.prevSiblingTarget(dndTaskId, targetTaskId, store);
      } else {
        if (relTargetPos < 0.5) {
          targetTaskId = prevSibling;
        }

        result = dropTarget.nextSiblingTarget(dndTaskId, targetTaskId, store);
      }
    } else if (targetLevel > level) {
      store.eachParent(function (parent) {
        if (store.calculateItemLevel(parent) === level) {
          targetTaskId = parent.id;
        }
      }, targetTask);
      result = findTargetAbove(dndTaskId, targetTaskId, level, store);
    } else {
      var targetAbove = findTargetAbove(dndTaskId, targetTaskId, level, store);
      var targetBelow = findTargetBelow(dndTaskId, targetTaskId, level, store);
      result = relTargetPos < 0.5 ? targetAbove : targetBelow;
    }
  } else {
    var rootId = store.$getRootId();
    var rootLevel = store.getChildren(rootId);
    result = dropTarget.createDropTargetObject();

    if (rootLevel.length && eventTop >= 0) {
      result = findTargetAbove(dndTaskId, getLast(store), level, store);
    } else {
      result = findTargetBelow(dndTaskId, rootId, level, store);
    }
  }

  return result;
};