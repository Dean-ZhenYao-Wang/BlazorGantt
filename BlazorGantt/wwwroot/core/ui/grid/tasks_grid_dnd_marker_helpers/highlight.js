var domHelpers = require("../../utils/dom_helpers");
/**
 * methods for highlighting current drag and drop position
 */


function highlightPosition(target, root, grid) {
  var markerPos = getTaskMarkerPosition(target, grid); // setting position of row

  root.marker.style.left = markerPos.x + 9 + "px";
  root.marker.style.width = markerPos.width + "px";
  root.marker.style.overflow = "hidden";
  var markerLine = root.markerLine;

  if (!markerLine) {
    markerLine = document.createElement("div");
    markerLine.className = "gantt_drag_marker gantt_grid_dnd_marker";
    markerLine.innerHTML = "<div class='gantt_grid_dnd_marker_line'></div>";
    markerLine.style.pointerEvents = "none";
  }

  if (target.child) {
    highlightFolder(target, markerLine, grid);
  } else {
    highlightRow(target, markerLine, grid);
  }

  if (!root.markerLine) {
    document.body.appendChild(markerLine);
    root.markerLine = markerLine;
  }
}

function removeLineHighlight(root) {
  if (root.markerLine && root.markerLine.parentNode) {
    root.markerLine.parentNode.removeChild(root.markerLine);
  }

  root.markerLine = null;
}

function highlightRow(target, markerLine, grid) {
  var linePos = getLineMarkerPosition(target, grid);
  var maxBottom = grid.$grid_data.getBoundingClientRect().bottom + window.scrollY;
  markerLine.innerHTML = "<div class='gantt_grid_dnd_marker_line'></div>";
  markerLine.style.left = linePos.x + "px";
  markerLine.style.height = "4px";
  var markerLineTop = linePos.y - 2;
  markerLine.style.top = markerLineTop + "px";
  markerLine.style.width = linePos.width + "px";

  if (markerLineTop > maxBottom) {
    markerLine.style.top = maxBottom + 'px';
  }

  return markerLine;
}

function highlightFolder(target, markerFolder, grid) {
  var id = target.targetParent;
  var pos = gridToPageCoordinates({
    x: 0,
    y: grid.getItemTop(id)
  }, grid);
  var maxBottom = grid.$grid_data.getBoundingClientRect().bottom + window.scrollY;
  var folderHighlightWidth = setWidthWithinContainer(grid.$gantt, grid.$grid_data.offsetWidth);
  markerFolder.innerHTML = "<div class='gantt_grid_dnd_marker_folder'></div>";
  markerFolder.style.width = folderHighlightWidth + "px";
  markerFolder.style.top = pos.y + "px";
  markerFolder.style.left = pos.x + "px";
  markerFolder.style.height = grid.getItemHeight(id) + "px";

  if (pos.y > maxBottom) {
    markerFolder.style.top = maxBottom + 'px';
  }

  return markerFolder;
}

function getLineMarkerPosition(target, grid) {
  var store = grid.$config.rowStore;
  var pos = {
    x: 0,
    y: 0
  };
  var indentNode = grid.$grid_data.querySelector(".gantt_tree_indent");
  var indent = 15;
  var level = 0;

  if (indentNode) {
    indent = indentNode.offsetWidth;
  }

  var iconWidth = 40;

  if (target.targetId !== store.$getRootId()) {
    var itemTop = grid.getItemTop(target.targetId);
    var itemHeight = grid.getItemHeight(target.targetId);
    level = store.exists(target.targetId) ? store.calculateItemLevel(store.getItem(target.targetId)) : 0;

    if (target.prevSibling) {
      pos.y = itemTop;
    } else if (target.nextSibling) {
      var childCount = 0;
      store.eachItem(function (child) {
        if (store.getIndexById(child.id) !== -1) childCount++;
      }, target.targetId);
      pos.y = itemTop + itemHeight + childCount * itemHeight;
    } else {
      pos.y = itemTop + itemHeight;
      level += 1;
    }
  }

  pos.x = iconWidth + level * indent;
  pos.width = setWidthWithinContainer(grid.$gantt, Math.max(grid.$grid_data.offsetWidth - pos.x, 0), pos.x);
  return gridToPageCoordinates(pos, grid);
}

function gridToPageCoordinates(pos, grid) {
  var gridPos = domHelpers.getNodePosition(grid.$grid_data);
  pos.x += gridPos.x + grid.$grid.scrollLeft;
  pos.y += gridPos.y - grid.$grid_data.scrollTop;
  return pos;
}

function getTaskMarkerPosition(e, grid) {
  var pos = domHelpers.getNodePosition(grid.$grid_data);
  var ePos = domHelpers.getRelativeEventPosition(e, grid.$grid_data); // row offset

  var x = pos.x + grid.$grid.scrollLeft;
  var y = ePos.y - 10;
  var rowHeight = grid.getItemHeight(e.targetId); // prevent moving row out of grid_data container

  if (y < pos.y) y = pos.y;
  var gridHeight = grid.getTotalHeight();
  if (y > pos.y + gridHeight - rowHeight) y = pos.y + gridHeight - rowHeight;
  pos.x = x;
  pos.y = y;
  pos.width = setWidthWithinContainer(grid.$gantt, pos.width, 9);
  return pos;
}

function setWidthWithinContainer(gantt, width) {
  var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var containerSize = domHelpers.getNodePosition(gantt.$root);

  if (width > containerSize.width) {
    width = containerSize.width - offset - 2;
  }

  return width;
}

module.exports = {
  removeLineHighlight: removeLineHighlight,
  highlightPosition: highlightPosition
};