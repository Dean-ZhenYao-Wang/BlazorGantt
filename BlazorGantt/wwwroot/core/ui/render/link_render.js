var isInViewPort = require("./viewport/is_link_in_viewport");

var getVisibleRange = require("./viewport/factory/get_visible_link_range");

function createLinkRender(gantt) {
  function _render_link_element(link, view, config) {
    var source = gantt.getTask(link.source);

    if (source.hide_bar) {
      return;
    }

    var target = gantt.getTask(link.target);

    if (target.hide_bar) {
      return;
    }

    var pt = path_builder.get_endpoint(link, view, source, target);
    var dy = pt.e_y - pt.y;
    var dx = pt.e_x - pt.x;

    if (!dx && !dy) {
      return null;
    }

    var dots = path_builder.get_points(link, view, source, target);
    var lines = drawer.get_lines(dots, view);
    var div = document.createElement("div");
    var css = "gantt_task_link";

    if (link.color) {
      css += " gantt_link_inline_color";
    }

    var cssTemplate = gantt.templates.link_class ? gantt.templates.link_class(link) : "";

    if (cssTemplate) {
      css += " " + cssTemplate;
    }

    if (config.highlight_critical_path && gantt.isCriticalLink) {
      if (gantt.isCriticalLink(link)) css += " gantt_critical_link";
    }

    div.className = css;

    if (view.$config.link_attribute) {
      div.setAttribute(view.$config.link_attribute, link.id);
      div.setAttribute("link_id", link.id);
    }

    for (var i = 0; i < lines.length; i++) {
      if (i == lines.length - 1) {
        lines[i].size -= config.link_arrow_size;
      }

      var el = drawer.render_line(lines[i], lines[i + 1], view, link.source);

      if (link.color) {
        el.firstChild.style.backgroundColor = link.color;
      }

      div.appendChild(el);
    }

    var direction = lines[lines.length - 1].direction;

    var endpoint = _render_link_arrow(dots[dots.length - 1], direction, view, link.source);

    if (link.color) {
      endpoint.style.borderColor = link.color;
    }

    div.appendChild(endpoint);

    gantt._waiAria.linkAttr(link, div);

    return div;
  }

  function _render_link_arrow(point, direction, view, targetId) {
    var config = view.$getConfig();
    var div = document.createElement("div");
    var top = point.y;
    var left = point.x;
    var size = config.link_arrow_size;
    var className = "gantt_link_arrow gantt_link_arrow_" + direction;

    switch (direction) {
      case drawer.dirs.right:
        top -= size / 2;
        left -= size;
        break;

      case drawer.dirs.left:
        top -= size / 2;
        break;

      case drawer.dirs.up:
        left -= size;
        break;

      case drawer.dirs.down:
        top += size * 2;
        left -= size;
        break;

      default:
        break;
    }

    div.style.cssText = ["top:" + top + "px", "left:" + left + 'px'].join(';');
    div.className = className;
    return div;
  }

  var drawer = {
    current_pos: null,
    dirs: {
      "left": 'left',
      "right": 'right',
      "up": 'up',
      "down": 'down'
    },
    path: [],
    clear: function clear() {
      this.current_pos = null;
      this.path = [];
    },
    point: function point(pos) {
      this.current_pos = gantt.copy(pos);
    },
    get_lines: function get_lines(dots) {
      this.clear();
      this.point(dots[0]);

      for (var i = 1; i < dots.length; i++) {
        this.line_to(dots[i]);
      }

      return this.get_path();
    },
    line_to: function line_to(pos) {
      var next = gantt.copy(pos);
      var prev = this.current_pos;

      var line = this._get_line(prev, next);

      this.path.push(line);
      this.current_pos = next;
    },
    get_path: function get_path() {
      return this.path;
    },
    get_wrapper_sizes: function get_wrapper_sizes(v, view, itemId) {
      var config = view.$getConfig();
      var res,
          wrapper_size = config.link_wrapper_width,
          y = v.y - wrapper_size / 2;

      switch (v.direction) {
        case this.dirs.left:
          res = {
            top: y,
            height: wrapper_size,
            lineHeight: wrapper_size,
            left: v.x - v.size - wrapper_size / 2,
            width: v.size + wrapper_size
          };
          break;

        case this.dirs.right:
          res = {
            top: y,
            lineHeight: wrapper_size,
            height: wrapper_size,
            left: v.x - wrapper_size / 2,
            width: v.size + wrapper_size
          };
          break;

        case this.dirs.up:
          res = {
            top: y - v.size,
            lineHeight: v.size + wrapper_size,
            height: v.size + wrapper_size,
            left: v.x - wrapper_size / 2,
            width: wrapper_size
          };
          break;

        case this.dirs.down:
          res = {
            top: y
            /*- wrapper_size/2*/
            ,
            lineHeight: v.size + wrapper_size,
            height: v.size + wrapper_size,
            left: v.x - wrapper_size / 2,
            width: wrapper_size
          };
          break;

        default:
          break;
      }

      return res;
    },
    get_line_sizes: function get_line_sizes(v, view) {
      var config = view.$getConfig();
      var res,
          line_size = config.link_line_width,
          wrapper_size = config.link_wrapper_width,
          size = v.size + line_size;

      switch (v.direction) {
        case this.dirs.left:
        case this.dirs.right:
          res = {
            height: line_size,
            width: size,
            marginTop: (wrapper_size - line_size) / 2,
            marginLeft: (wrapper_size - line_size) / 2
          };
          break;

        case this.dirs.up:
        case this.dirs.down:
          res = {
            height: size,
            width: line_size,
            marginTop: (wrapper_size - line_size) / 2,
            marginLeft: (wrapper_size - line_size) / 2
          };
          break;

        default:
          break;
      }

      return res;
    },
    render_line: function render_line(v, end, view, itemId) {
      var pos = this.get_wrapper_sizes(v, view, itemId);
      var wrapper = document.createElement("div");
      wrapper.style.cssText = ["top:" + pos.top + "px", "left:" + pos.left + "px", "height:" + pos.height + "px", "width:" + pos.width + "px"].join(';');
      wrapper.className = "gantt_line_wrapper";
      var innerPos = this.get_line_sizes(v, view);
      var inner = document.createElement("div");
      inner.style.cssText = ["height:" + innerPos.height + "px", "width:" + innerPos.width + "px", "margin-top:" + innerPos.marginTop + "px", "margin-left:" + innerPos.marginLeft + "px"].join(";");
      inner.className = "gantt_link_line_" + v.direction;
      wrapper.appendChild(inner);
      return wrapper;
    },
    _get_line: function _get_line(from, to) {
      var direction = this.get_direction(from, to);
      var vect = {
        x: from.x,
        y: from.y,
        direction: this.get_direction(from, to)
      };

      if (direction == this.dirs.left || direction == this.dirs.right) {
        vect.size = Math.abs(from.x - to.x);
      } else {
        vect.size = Math.abs(from.y - to.y);
      }

      return vect;
    },
    get_direction: function get_direction(from, to) {
      var direction = 0;

      if (to.x < from.x) {
        direction = this.dirs.left;
      } else if (to.x > from.x) {
        direction = this.dirs.right;
      } else if (to.y > from.y) {
        direction = this.dirs.down;
      } else {
        direction = this.dirs.up;
      }

      return direction;
    }
  };
  var path_builder = {
    path: [],
    clear: function clear() {
      this.path = [];
    },
    current: function current() {
      return this.path[this.path.length - 1];
    },
    point: function point(next) {
      if (!next) return this.current();
      this.path.push(gantt.copy(next));
      return next;
    },
    point_to: function point_to(direction, diff, point) {
      if (!point) point = gantt.copy(this.point());else point = {
        x: point.x,
        y: point.y
      };
      var dir = drawer.dirs;

      switch (direction) {
        case dir.left:
          point.x -= diff;
          break;

        case dir.right:
          point.x += diff;
          break;

        case dir.up:
          point.y -= diff;
          break;

        case dir.down:
          point.y += diff;
          break;

        default:
          break;
      }

      return this.point(point);
    },
    get_points: function get_points(link, view, source, target) {
      var pt = this.get_endpoint(link, view, source, target);
      var xy = gantt.config;
      var dy = pt.e_y - pt.y;
      var dx = pt.e_x - pt.x;
      var dir = drawer.dirs;
      var rowHeight = view.getItemHeight(link.source);
      this.clear();
      this.point({
        x: pt.x,
        y: pt.y
      });
      var shiftX = 2 * xy.link_arrow_size; //just random size for first line

      var lineType = this.get_line_type(link, view.$getConfig());
      var forward = pt.e_x > pt.x;

      if (lineType.from_start && lineType.to_start) {
        this.point_to(dir.left, shiftX);

        if (forward) {
          this.point_to(dir.down, dy);
          this.point_to(dir.right, dx);
        } else {
          this.point_to(dir.right, dx);
          this.point_to(dir.down, dy);
        }

        this.point_to(dir.right, shiftX);
      } else if (!lineType.from_start && lineType.to_start) {
        forward = pt.e_x > pt.x + 2 * shiftX;
        this.point_to(dir.right, shiftX);

        if (forward) {
          dx -= shiftX;
          this.point_to(dir.down, dy);
          this.point_to(dir.right, dx);
        } else {
          dx -= 2 * shiftX;
          var sign = dy > 0 ? 1 : -1;
          this.point_to(dir.down, sign * (rowHeight / 2));
          this.point_to(dir.right, dx);
          this.point_to(dir.down, sign * (Math.abs(dy) - rowHeight / 2));
          this.point_to(dir.right, shiftX);
        }
      } else if (!lineType.from_start && !lineType.to_start) {
        this.point_to(dir.right, shiftX);

        if (forward) {
          this.point_to(dir.right, dx);
          this.point_to(dir.down, dy);
        } else {
          this.point_to(dir.down, dy);
          this.point_to(dir.right, dx);
        }

        this.point_to(dir.left, shiftX);
      } else if (lineType.from_start && !lineType.to_start) {
        forward = pt.e_x > pt.x - 2 * shiftX;
        this.point_to(dir.left, shiftX);

        if (!forward) {
          dx += shiftX;
          this.point_to(dir.down, dy);
          this.point_to(dir.right, dx);
        } else {
          dx += 2 * shiftX;
          var sign = dy > 0 ? 1 : -1;
          this.point_to(dir.down, sign * (rowHeight / 2));
          this.point_to(dir.right, dx);
          this.point_to(dir.down, sign * (Math.abs(dy) - rowHeight / 2));
          this.point_to(dir.left, shiftX);
        }
      }

      return this.path;
    },
    get_line_type: function get_line_type(link, config) {
      var types = config.links;
      var from_start = false,
          to_start = false;

      if (link.type == types.start_to_start) {
        from_start = to_start = true;
      } else if (link.type == types.finish_to_finish) {
        from_start = to_start = false;
      } else if (link.type == types.finish_to_start) {
        from_start = false;
        to_start = true;
      } else if (link.type == types.start_to_finish) {
        from_start = true;
        to_start = false;
      } else {
        gantt.assert(false, "Invalid link type");
      }

      if (config.rtl) {
        from_start = !from_start;
        to_start = !to_start;
      }

      return {
        from_start: from_start,
        to_start: to_start
      };
    },
    get_endpoint: function get_endpoint(link, view, source, target) {
      var config = view.$getConfig();
      var lineType = this.get_line_type(link, config);
      var from_start = lineType.from_start,
          to_start = lineType.to_start;
      var from = getMilestonePosition(source, view, config),
          to = getMilestonePosition(target, view, config);
      return {
        x: from_start ? from.left : from.left + from.width,
        e_x: to_start ? to.left : to.left + to.width,
        y: from.top + from.rowHeight / 2 - 1,
        e_y: to.top + to.rowHeight / 2 - 1
      };
    }
  };

  function getMilestonePosition(task, view, config) {
    var pos = view.getItemPosition(task);

    if (gantt.getTaskType(task.type) == config.types.milestone) {
      var milestoneHeight = view.getBarHeight(task.id, true);
      var milestoneWidth = Math.sqrt(2 * milestoneHeight * milestoneHeight);
      pos.left -= milestoneWidth / 2;
      pos.width = milestoneWidth;
    }

    return pos;
  }

  return {
    render: _render_link_element,
    update: null,
    //getRectangle: getLinkRectangle
    isInViewPort: isInViewPort,
    getVisibleRange: getVisibleRange()
  };
}

module.exports = createLinkRender;