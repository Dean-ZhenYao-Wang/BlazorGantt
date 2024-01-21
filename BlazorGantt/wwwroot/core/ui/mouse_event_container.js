function create(gantt) {
  var events = [];
  return {
    delegate: function delegate(event, className, handler, root) {
      events.push([event, className, handler, root]);
      var helper = gantt.$services.getService("mouseEvents");
      helper.delegate(event, className, handler, root);
    },
    destructor: function destructor() {
      var mouseEvents = gantt.$services.getService("mouseEvents");

      for (var i = 0; i < events.length; i++) {
        var h = events[i];
        mouseEvents.detach(h[0], h[1], h[2], h[3]);
      }

      events = [];
    }
  };
}

module.exports = create;