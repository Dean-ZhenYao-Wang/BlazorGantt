/**
 * The state object for order branch drag and drop
 */
var utils = require("../../../../utils/utils");

module.exports = {
  createDropTargetObject: function createDropTargetObject(parent) {
    var res = {
      targetParent: null,
      targetIndex: 0,
      targetId: null,
      child: false,
      nextSibling: false,
      prevSibling: false
    };

    if (parent) {
      utils.mixin(res, parent, true);
    }

    return res;
  },
  nextSiblingTarget: function nextSiblingTarget(dndTaskId, targetTaskId, store) {
    var result = this.createDropTargetObject();
    result.targetId = targetTaskId;
    result.nextSibling = true;
    result.targetParent = store.getParent(result.targetId);
    result.targetIndex = store.getBranchIndex(result.targetId);

    if (store.getParent(dndTaskId) != result.targetParent || result.targetIndex < store.getBranchIndex(dndTaskId)) {
      result.targetIndex += 1;
    }

    return result;
  },
  prevSiblingTarget: function prevSiblingTarget(dndTaskId, targetTaskId, store) {
    var result = this.createDropTargetObject();
    result.targetId = targetTaskId;
    result.prevSibling = true;
    result.targetParent = store.getParent(result.targetId);
    result.targetIndex = store.getBranchIndex(result.targetId);

    if (store.getParent(dndTaskId) == result.targetParent && result.targetIndex > store.getBranchIndex(dndTaskId)) {
      result.targetIndex -= 1;
    }

    return result;
  },
  firstChildTarget: function firstChildTarget(dndTaskId, targetTaskId, store) {
    var result = this.createDropTargetObject();
    result.targetId = targetTaskId;
    result.targetParent = result.targetId;
    result.targetIndex = 0;
    result.child = true;
    return result;
  },
  lastChildTarget: function lastChildTarget(dndTaskId, targetTaskId, store) {
    var children = store.getChildren(targetTaskId);
    var result = this.createDropTargetObject();
    result.targetId = children[children.length - 1];
    result.targetParent = targetTaskId;
    result.targetIndex = children.length;
    result.nextSibling = true;
    return result;
  }
};