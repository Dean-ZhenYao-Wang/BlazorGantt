if (window.dhtmlx) {
  if (!window.dhtmlx.attaches) window.dhtmlx.attaches = {};

  window.dhtmlx.attaches.attachGantt = function (start, end, gantt) {
    var obj = document.createElement("DIV");
    gantt = gantt || window.gantt;
    obj.id = "gantt_" + gantt.uid();
    obj.style.width = "100%";
    obj.style.height = "100%";
    obj.cmp = "grid";
    document.body.appendChild(obj);
    this.attachObject(obj.id);
    this.dataType = "gantt";
    this.dataObj = gantt;
    var that = this.vs[this.av];
    that.grid = gantt;
    gantt.init(obj.id, start, end);
    obj.firstChild.style.border = "none";
    that.gridId = obj.id;
    that.gridObj = obj;
    var method_name = "_viewRestore";
    return this.vs[this[method_name]()].grid;
  };
}

if (typeof window.dhtmlXCellObject != "undefined") {
  window.dhtmlXCellObject.prototype.attachGantt = function (start, end, gantt) {
    gantt = gantt || window.gantt;
    var obj = document.createElement("DIV");
    obj.id = "gantt_" + gantt.uid();
    obj.style.width = "100%";
    obj.style.height = "100%";
    obj.cmp = "grid";
    document.body.appendChild(obj);
    this.attachObject(obj.id);
    this.dataType = "gantt";
    this.dataObj = gantt;
    gantt.init(obj.id, start, end);
    obj.firstChild.style.border = "none";
    obj = null;
    this.callEvent("_onContentAttach", []);
    return this.dataObj;
  };
}

module.exports = null;