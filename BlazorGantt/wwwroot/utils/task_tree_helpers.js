function copyLinkIdsArray(gantt, linkIds, targetHash) {
  for (var i = 0; i < linkIds.length; i++) {
    if (gantt.isLinkExists(linkIds[i])) {
      targetHash[linkIds[i]] = gantt.getLink(linkIds[i]);
    }
  }
}

function copyLinkIds(gantt, task, targetHash) {
  copyLinkIdsArray(gantt, task.$source, targetHash);
  copyLinkIdsArray(gantt, task.$target, targetHash);
}

function getSubtreeLinks(gantt, rootId) {
  var res = {};

  if (gantt.isTaskExists(rootId)) {
    copyLinkIds(gantt, gantt.getTask(rootId), res);
  }

  gantt.eachTask(function (child) {
    copyLinkIds(gantt, child, res);
  }, rootId);
  return res;
}

function getSubtreeTasks(gantt, rootId) {
  var res = {};
  gantt.eachTask(function (child) {
    res[child.id] = child;
  }, rootId);
  return res;
}

module.exports = {
  getSubtreeLinks: getSubtreeLinks,
  getSubtreeTasks: getSubtreeTasks
};