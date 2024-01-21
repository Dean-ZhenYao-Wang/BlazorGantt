var domHelpers = require("../utils/dom_helpers");

var initLinksDND = function initLinksDND(timeline, gantt) {
  var _link_landing,
      _link_target_task,
      _link_target_task_start,
      _link_source_task,
      _link_source_task_start,
      markerDefaultOffset = 10,
      scrollDefaultSize = 18;

  function getVisibleMilestoneWidth(taskId) {
    var origWidth = timeline.getBarHeight(taskId, true); //m-s have square shape

    return Math.round(Math.sqrt(2 * origWidth * origWidth)) - 2;
  }

  function isMilestone(task) {
    return gantt.getTaskType(task.type) == gantt.config.types.milestone;
  }

  function getDndState() {
    return {
      link_source_id: _link_source_task,
      link_target_id: _link_target_task,
      link_from_start: _link_source_task_start,
      link_to_start: _link_target_task_start,
      link_landing_area: _link_landing
    };
  }

  var services = gantt.$services;
  var state = services.getService("state");
  var DnD = services.getService("dnd");
  state.registerProvider("linksDnD", getDndState);
  var start_marker = "task_start_date",
      end_marker = "task_end_date",
      link_edge_marker = "gantt_link_point",
      link_landing_hover_area = "gantt_link_control";
  var dnd = new DnD(timeline.$task_bars, {
    sensitivity: 0,
    updates_per_second: 60,
    mousemoveContainer: gantt.$root,
    selector: "." + link_edge_marker,
    preventDefault: true
  });
  dnd.attachEvent("onBeforeDragStart", gantt.bind(function (obj, e) {
    var target = e.target || e.srcElement;
    resetDndState();
    if (gantt.getState("tasksDnd").drag_id) return false;

    if (domHelpers.locateClassName(target, link_edge_marker)) {
      if (domHelpers.locateClassName(target, start_marker)) _link_source_task_start = true;
      var sid = gantt.locate(e);
      _link_source_task = sid;
      var t = gantt.getTask(sid);

      if (gantt.isReadonly(t)) {
        resetDndState();
        return false;
      }

      var shift = 0;
      this._dir_start = getLinePos(t, !!_link_source_task_start, shift, timeline.$getConfig(), true);
      return true;
    } else {
      return false;
    }
  }, this));
  dnd.attachEvent("onAfterDragStart", gantt.bind(function (obj, e) {
    if (gantt.config.touch) {
      gantt.refreshData();
    }

    updateMarkedHtml(dnd.config.marker);
  }, this));

  function getLinePos(task, to_start, shift, cfg, isStart) {
    var taskPos = getMilestonePosition(task, function (task) {
      return gantt.getTaskPosition(task);
    }, cfg);
    var pos = {
      x: taskPos.x,
      y: taskPos.y
    };

    if (!to_start) {
      pos.x = taskPos.xEnd;
    } //var pos = gantt._get_task_pos(task, !!to_start);


    pos.y += gantt.getTaskHeight(task.id) / 2;
    var offset = isMilestone(task) && isStart ? 2 : 0;
    shift = shift || 0;
    if (cfg.rtl) shift = shift * -1;
    pos.x += (to_start ? -1 : 1) * shift - offset;
    return pos;
  }

  function getMilestonePosition(task, getTaskPosition, cfg) {
    var pos = getTaskPosition(task);
    var res = {
      x: pos.left,
      y: pos.top,
      width: pos.width,
      height: pos.height
    };

    if (cfg.rtl) {
      res.xEnd = res.x;
      res.x = res.xEnd + res.width;
    } else {
      res.xEnd = res.x + res.width;
    }

    res.yEnd = res.y + res.height;

    if (gantt.getTaskType(task.type) == gantt.config.types.milestone) {
      var milestoneWidth = getVisibleMilestoneWidth(task.id);
      res.x += (!cfg.rtl ? -1 : 1) * (milestoneWidth / 2);
      res.xEnd += (!cfg.rtl ? 1 : -1) * (milestoneWidth / 2); //pos.x -= milestoneWidth / 2;
      //pos.xEnd += milestoneWidth / 2;

      res.width = pos.xEnd - pos.x;
    }

    return res;
  }

  function getVieportSize() {
    var root = gantt.$root;
    return {
      right: root.offsetWidth,
      bottom: root.offsetHeight
    };
  }

  function getMarkerSize(marker) {
    var width = 0,
        height = 0;

    if (marker) {
      width = marker.offsetWidth || 0;
      height = marker.offsetHeight || 0;
    }

    return {
      width: width,
      height: height
    };
  }

  function getPosition(e, marker) {
    var oldPos = dnd.getPosition(e);
    var markerSize = getMarkerSize(marker);
    var viewportSize = getVieportSize();
    var offsetX = gantt.config.tooltip_offset_x || markerDefaultOffset;
    var offsetY = gantt.config.tooltip_offset_y || markerDefaultOffset;
    var scrollSize = gantt.config.scroll_size || scrollDefaultSize; // GS-1315: Add offset if there are elements above Gantt

    var ganttOffsetY = gantt.$container.getBoundingClientRect().y + window.scrollY;
    var position = {
      y: oldPos.y + offsetY,
      x: oldPos.x + offsetX,
      bottom: oldPos.y + markerSize.height + offsetY + scrollSize,
      right: oldPos.x + markerSize.width + offsetX + scrollSize
    };

    if (position.bottom > viewportSize.bottom + ganttOffsetY) {
      position.y = viewportSize.bottom + ganttOffsetY - markerSize.height - offsetY;
    }

    if (position.right > viewportSize.right) {
      position.x = viewportSize.right - markerSize.width - offsetX;
    }

    return position;
  }

  dnd.attachEvent("onDragMove", gantt.bind(function (obj, e) {
    var dd = dnd.config;
    var pos = getPosition(e, dd.marker);
    advanceMarker(dd.marker, pos);
    var landing = !!domHelpers.locateClassName(e, link_landing_hover_area);
    var prevTarget = _link_target_task;
    var prevLanding = _link_landing;
    var prevToStart = _link_target_task_start;
    var targ = gantt.locate(e),
        to_start = true; // can drag and drop link to another gantt on the page, such links are not supported

    var eventTarget = domHelpers.getTargetNode(e);
    var sameGantt = domHelpers.isChildOf(eventTarget, gantt.$root);

    if (!sameGantt) {
      landing = false;
      targ = null;
    }

    if (landing) {
      //refreshTask
      to_start = !domHelpers.locateClassName(e, end_marker);
      landing = !!targ;
    }

    _link_target_task = targ;
    _link_landing = landing;
    _link_target_task_start = to_start;

    if (landing) {
      var t = gantt.getTask(targ);
      var config = timeline.$getConfig();
      var node = domHelpers.locateClassName(e, link_landing_hover_area);
      var shift = 0;

      if (node) {
        shift = Math.floor(node.offsetWidth / 2);
      }

      this._dir_end = getLinePos(t, !!_link_target_task_start, shift, config);
    } else {
      this._dir_end = domHelpers.getRelativeEventPosition(e, timeline.$task_data);

      if (gantt.env.isEdge) {
        // to fix margin collapsing
        this._dir_end.y += window.scrollY;
      }
    }

    var targetChanged = !(prevLanding == landing && prevTarget == targ && prevToStart == to_start);

    if (targetChanged) {
      if (prevTarget) gantt.refreshTask(prevTarget, false);
      if (targ) gantt.refreshTask(targ, false);
    }

    if (targetChanged) {
      updateMarkedHtml(dd.marker);
    }

    showDirectingLine(this._dir_start.x, this._dir_start.y, this._dir_end.x, this._dir_end.y);
    return true;
  }, this));
  dnd.attachEvent("onDragEnd", gantt.bind(function () {
    var drag = getDndState();

    if (drag.link_source_id && drag.link_target_id && drag.link_source_id != drag.link_target_id) {
      var type = gantt._get_link_type(drag.link_from_start, drag.link_to_start);

      var link = {
        source: drag.link_source_id,
        target: drag.link_target_id,
        type: type
      };

      if (link.type && gantt.isLinkAllowed(link)) {
        if (gantt.callEvent("onLinkCreated", [link])) {
          gantt.addLink(link);
        }
      }
    }

    resetDndState();

    if (gantt.config.touch) {
      gantt.refreshData();
    } else {
      if (drag.link_source_id) gantt.refreshTask(drag.link_source_id, false);
      if (drag.link_target_id) gantt.refreshTask(drag.link_target_id, false);
    }

    removeDirectionLine();
  }, this));

  function updateMarkedHtml(marker) {
    var link = getDndState();
    var css = ["gantt_link_tooltip"];

    if (link.link_source_id && link.link_target_id) {
      if (gantt.isLinkAllowed(link.link_source_id, link.link_target_id, link.link_from_start, link.link_to_start)) {
        css.push("gantt_allowed_link");
      } else {
        css.push("gantt_invalid_link");
      }
    }

    var className = gantt.templates.drag_link_class(link.link_source_id, link.link_from_start, link.link_target_id, link.link_to_start);
    if (className) css.push(className);
    var html = "<div class='" + className + "'>" + gantt.templates.drag_link(link.link_source_id, link.link_from_start, link.link_target_id, link.link_to_start) + "</div>";
    marker.innerHTML = html;
  }

  function advanceMarker(marker, pos) {
    marker.style.left = pos.x + "px";
    marker.style.top = pos.y + "px";
  }

  function resetDndState() {
    _link_source_task = _link_source_task_start = _link_target_task = null;
    _link_target_task_start = true;
  }

  function showDirectingLine(s_x, s_y, e_x, e_y) {
    var div = getDirectionLine();
    var link = getDndState();
    var css = ["gantt_link_direction"];

    if (gantt.templates.link_direction_class) {
      css.push(gantt.templates.link_direction_class(link.link_source_id, link.link_from_start, link.link_target_id, link.link_to_start));
    }

    var dist = Math.sqrt(Math.pow(e_x - s_x, 2) + Math.pow(e_y - s_y, 2));
    dist = Math.max(0, dist - 3);
    if (!dist) return;
    div.className = css.join(" ");
    var tan = (e_y - s_y) / (e_x - s_x),
        angle = Math.atan(tan);

    if (coordinateCircleQuarter(s_x, e_x, s_y, e_y) == 2) {
      angle += Math.PI;
    } else if (coordinateCircleQuarter(s_x, e_x, s_y, e_y) == 3) {
      angle -= Math.PI;
    }

    var sin = Math.sin(angle),
        cos = Math.cos(angle),
        top = Math.round(s_y),
        left = Math.round(s_x);
    var style = ["-webkit-transform: rotate(" + angle + "rad)", "-moz-transform: rotate(" + angle + "rad)", "-ms-transform: rotate(" + angle + "rad)", "-o-transform: rotate(" + angle + "rad)", "transform: rotate(" + angle + "rad)", "width:" + Math.round(dist) + "px"];

    if (window.navigator.userAgent.indexOf("MSIE 8.0") != -1) {
      //ms-filter breaks styles in ie9, so add it only for 8th
      style.push("-ms-filter: \"" + ieTransform(sin, cos) + "\"");
      var shiftLeft = Math.abs(Math.round(s_x - e_x)),
          shiftTop = Math.abs(Math.round(e_y - s_y)); //fix rotation axis

      switch (coordinateCircleQuarter(s_x, e_x, s_y, e_y)) {
        case 1:
          top -= shiftTop;
          break;

        case 2:
          left -= shiftLeft;
          top -= shiftTop;
          break;

        case 3:
          left -= shiftLeft;
          break;

        default:
          break;
      }
    }

    style.push("top:" + top + "px");
    style.push("left:" + left + "px");
    div.style.cssText = style.join(";");
  }

  function ieTransform(sin, cos) {
    return "progid:DXImageTransform.Microsoft.Matrix(" + "M11 = " + cos + "," + "M12 = -" + sin + "," + "M21 = " + sin + "," + "M22 = " + cos + "," + "SizingMethod = 'auto expand'" + ")";
  }

  function coordinateCircleQuarter(sX, eX, sY, eY) {
    if (eX >= sX) {
      if (eY <= sY) {
        return 1;
      } else {
        return 4;
      }
    } else {
      if (eY <= sY) {
        return 2;
      } else {
        return 3;
      }
    }
  }

  function getDirectionLine() {
    if (!dnd._direction || !dnd._direction.parentNode) {
      dnd._direction = document.createElement("div");
      timeline.$task_links.appendChild(dnd._direction);
    }

    return dnd._direction;
  }

  function removeDirectionLine() {
    if (dnd._direction) {
      if (dnd._direction.parentNode) //the event line can be detached because of data refresh
        dnd._direction.parentNode.removeChild(dnd._direction);
      dnd._direction = null;
    }
  }

  gantt.attachEvent("onGanttRender", gantt.bind(function () {
    if (dnd._direction) {
      showDirectingLine(this._dir_start.x, this._dir_start.y, this._dir_end.x, this._dir_end.y);
    }
  }, this));
};

module.exports = {
  createLinkDND: function createLinkDND() {
    return {
      init: initLinksDND
    };
  }
};