function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var helpers = require("../utils/helpers");

module.exports = function (gantt) {
  gantt.load = function (url, type, callback) {
    this._load_url = url;
    this.assert(arguments.length, "Invalid load arguments");
    var tp = 'json',
        cl = null;

    if (arguments.length >= 3) {
      tp = type;
      cl = callback;
    } else {
      if (typeof arguments[1] == "string") tp = arguments[1];else if (typeof arguments[1] == "function") cl = arguments[1];
    }

    this._load_type = tp;
    this.callEvent("onLoadStart", [url, tp]);
    return this.ajax.get(url, gantt.bind(function (l) {
      this.on_load(l, tp);
      this.callEvent("onLoadEnd", [url, tp]);
      if (typeof cl == "function") cl.call(this);
    }, this));
  };

  gantt.parse = function (data, type) {
    this.on_load({
      xmlDoc: {
        responseText: data
      }
    }, type);
  };

  gantt.serialize = function (type) {
    type = type || "json";
    return this[type].serialize();
  };
  /*
  tasks and relations
  {
  data:[
  	{
  		"id":"string",
  		"text":"...",
  		"start_date":"Date or string",
  		"end_date":"Date or string",
  		"duration":"number",
  		"progress":"0..1",
  		"parent_id":"string",
  		"order":"number"
  	},...],
  links:[
  	{
  		id:"string",
  		source:"string",
  		target:"string",
  		type:"string"
  	},...],
  collections:{
  		collectionName:[
  			{key:, label:, optional:...},...
  		],...
  	}
  }
  
  * */


  gantt.on_load = function (resp, type) {
    if (resp.xmlDoc && resp.xmlDoc.status === 404) {
      // work if we don't have a file at current url
      this.assert(false, "Failed to load the data from <a href='" + resp.xmlDoc.responseURL + "' target='_blank'>" + resp.xmlDoc.responseURL + "</a>, server returns 404");
      return;
    }

    if (gantt.$destroyed) {
      return;
    }

    this.callEvent("onBeforeParse", []);
    if (!type) type = "json";
    this.assert(this[type], "Invalid data type:'" + type + "'");
    var raw = resp.xmlDoc.responseText;
    var data = this[type].parse(raw, resp);

    this._process_loading(data);
  };

  function attachAssignmentsToTasks(tasks, assignments) {
    var assignmentsByTasks = {};
    assignments.forEach(function (a) {
      if (!assignmentsByTasks[a.task_id]) {
        assignmentsByTasks[a.task_id] = [];
      }

      assignmentsByTasks[a.task_id].push(a);
    });
    tasks.forEach(function (t) {
      t[gantt.config.resource_property] = assignmentsByTasks[t.id] || [];
    });
  }

  gantt._process_loading = function (data) {
    if (data.collections) this._load_collections(data.collections);

    if (data.resources && this.$data.resourcesStore) {
      this.$data.resourcesStore.parse(data.resources);
    }

    var tasks = data.data || data.tasks;

    if (data.assignments) {
      attachAssignmentsToTasks(tasks, data.assignments);
    }

    this.$data.tasksStore.parse(tasks);
    var links = data.links || (data.collections ? data.collections.links : []);
    this.$data.linksStore.parse(links); //this._sync_links();

    this.callEvent("onParse", []);
    this.render();
  };

  gantt._load_collections = function (collections) {
    var collections_loaded = false;

    for (var key in collections) {
      if (collections.hasOwnProperty(key)) {
        collections_loaded = true;
        var collection = collections[key]; // GS-1728. Create an empty serverList if it doesn't exist

        this.serverList[key] = this.serverList[key] || [];
        var arr = this.serverList[key];
        if (!arr) continue;
        arr.splice(0, arr.length); //clear old options

        for (var j = 0; j < collection.length; j++) {
          var option = collection[j];
          var obj = this.copy(option);
          obj.key = obj.value; // resulting option object

          for (var option_key in option) {
            if (option.hasOwnProperty(option_key)) {
              if (option_key == "value" || option_key == "label") continue;
              obj[option_key] = option[option_key]; // obj['value'] = option['value']
            }
          }

          arr.push(obj);
        }
      }
    }

    if (collections_loaded) this.callEvent("onOptionsLoad", []);
  };

  gantt.attachEvent("onBeforeTaskDisplay", function (id, task) {
    return !task.$ignore;
  });

  function jsonParseError(data) {
    gantt.assert(false, "Can't parse data: incorrect value of gantt.parse or gantt.load method. " + "Actual argument value: " + JSON.stringify(data));
    throw new Error("Invalid argument for gantt.parse or gantt.load. An object or a JSON string of format https://docs.dhtmlx.com/gantt/desktop__supported_data_formats.html#json is expected. Actual argument value: " + JSON.stringify(data));
  }

  gantt.json = {
    parse: function parse(data) {
      if (!data) {
        jsonParseError(data);
      }

      if (typeof data == "string") {
        if ((typeof JSON === "undefined" ? "undefined" : _typeof(JSON)) != undefined) {
          try {
            data = JSON.parse(data);
          } catch (e) {
            jsonParseError(data);
          }
        } else {
          gantt.assert(false, "JSON is not supported");
        }
      }

      if (!data.data && !data.tasks) {
        jsonParseError(data);
      }

      if (data.dhx_security) gantt.security_key = data.dhx_security;
      return data;
    },
    serializeTask: function serializeTask(task) {
      return this._copyObject(task);
    },
    serializeLink: function serializeLink(link) {
      return this._copyLink(link);
    },
    _copyLink: function _copyLink(obj) {
      var copy = {};

      for (var key in obj) {
        copy[key] = obj[key];
      }

      return copy;
    },
    _copyObject: function _copyObject(obj) {
      var copy = {};

      for (var key in obj) {
        if (key.charAt(0) == "$") continue;
        copy[key] = obj[key];

        if (helpers.isDate(copy[key])) {
          copy[key] = gantt.defined(gantt.templates.xml_format) ? gantt.templates.xml_format(copy[key]) : gantt.templates.format_date(copy[key]);
        }
      }

      return copy;
    },
    serialize: function serialize() {
      var tasks = [];
      var links = [];
      gantt.eachTask(function (obj) {
        gantt.resetProjectDates(obj);
        tasks.push(this.serializeTask(obj));
      }, gantt.config.root_id, this);
      var rawLinks = gantt.getLinks();

      for (var i = 0; i < rawLinks.length; i++) {
        links.push(this.serializeLink(rawLinks[i]));
      }

      return {
        data: tasks,
        links: links
      };
    }
  };
  /*
  <data>
  	<task id:"some" parent_id="0" progress="0.5">
  		<text>My task 1</text>
  		<start_date>16.08.2013</start_date>
  		<end_date>22.08.2013</end_date>
  	</task>
  	<coll_options>
  		<links>
  			<link source='a1' target='b2' type='c3' />
  		</links>
  	</coll_options>
  </data>
  */

  function xmlParseError(data) {
    gantt.assert(false, "Can't parse data: incorrect value of gantt.parse or gantt.load method. " + "Actual argument value: " + JSON.stringify(data));
    throw new Error("Invalid argument for gantt.parse or gantt.load. An XML of format https://docs.dhtmlx.com/gantt/desktop__supported_data_formats.html#xmldhtmlxgantt20 is expected. Actual argument value: " + JSON.stringify(data));
  }

  gantt.xml = {
    _xmlNodeToJSON: function _xmlNodeToJSON(node, attrs_only) {
      var t = {};

      for (var i = 0; i < node.attributes.length; i++) {
        t[node.attributes[i].name] = node.attributes[i].value;
      }

      if (!attrs_only) {
        for (var i = 0; i < node.childNodes.length; i++) {
          var child = node.childNodes[i];
          if (child.nodeType == 1) t[child.tagName] = child.firstChild ? child.firstChild.nodeValue : "";
        }

        if (!t.text) t.text = node.firstChild ? node.firstChild.nodeValue : "";
      }

      return t;
    },
    _getCollections: function _getCollections(loader) {
      var collection = {};
      var opts = gantt.ajax.xpath("//coll_options", loader);

      for (var i = 0; i < opts.length; i++) {
        var bind = opts[i].getAttribute("for");
        var arr = collection[bind] = [];
        var itms = gantt.ajax.xpath(".//item", opts[i]);

        for (var j = 0; j < itms.length; j++) {
          var itm = itms[j];
          var attrs = itm.attributes;
          var obj = {
            key: itms[j].getAttribute("value"),
            label: itms[j].getAttribute("label")
          };

          for (var k = 0; k < attrs.length; k++) {
            var attr = attrs[k];
            if (attr.nodeName == "value" || attr.nodeName == "label") continue;
            obj[attr.nodeName] = attr.nodeValue;
          }

          arr.push(obj);
        }
      }

      return collection;
    },
    _getXML: function _getXML(text, loader, toptag) {
      toptag = toptag || "data";

      if (!loader.getXMLTopNode) {
        loader = gantt.ajax.parse(loader);
      }

      var xml = gantt.ajax.xmltop(toptag, loader.xmlDoc);

      if (!xml || xml.tagName != toptag) {
        xmlParseError(text);
      }

      var skey = xml.getAttribute("dhx_security");
      if (skey) gantt.security_key = skey;
      return xml;
    },
    parse: function parse(text, loader) {
      loader = this._getXML(text, loader);
      var data = {};
      var evs = data.data = [];
      var xml = gantt.ajax.xpath("//task", loader);

      for (var i = 0; i < xml.length; i++) {
        evs[i] = this._xmlNodeToJSON(xml[i]);
      }

      data.collections = this._getCollections(loader);
      return data;
    },
    _copyLink: function _copyLink(obj) {
      return "<item id='" + obj.id + "' source='" + obj.source + "' target='" + obj.target + "' type='" + obj.type + "' />";
    },
    _copyObject: function _copyObject(obj) {
      return "<task id='" + obj.id + "' parent='" + (obj.parent || "") + "' start_date='" + obj.start_date + "' duration='" + obj.duration + "' open='" + !!obj.open + "' progress='" + obj.progress + "' end_date='" + obj.end_date + "'><![CDATA[" + obj.text + "]]></task>";
    },
    serialize: function serialize() {
      var tasks = [];
      var links = [];
      var json = gantt.json.serialize();

      for (var i = 0, len = json.data.length; i < len; i++) {
        tasks.push(this._copyObject(json.data[i]));
      }

      for (var i = 0, len = json.links.length; i < len; i++) {
        links.push(this._copyLink(json.links[i]));
      }

      return "<data>" + tasks.join("") + "<coll_options for='links'>" + links.join("") + "</coll_options></data>";
    }
  };
  gantt.oldxml = {
    parse: function parse(text, loader) {
      loader = gantt.xml._getXML(text, loader, "projects");
      var data = {
        collections: {
          links: []
        }
      };
      var evs = data.data = [];
      var xml = gantt.ajax.xpath("//task", loader);

      for (var i = 0; i < xml.length; i++) {
        evs[i] = gantt.xml._xmlNodeToJSON(xml[i]);
        var parent = xml[i].parentNode;
        if (parent.tagName == "project") evs[i].parent = "project-" + parent.getAttribute("id");else evs[i].parent = parent.parentNode.getAttribute("id");
      }

      xml = gantt.ajax.xpath("//project", loader);

      for (var i = 0; i < xml.length; i++) {
        var ev = gantt.xml._xmlNodeToJSON(xml[i], true);

        ev.id = "project-" + ev.id;
        evs.push(ev);
      }

      for (var i = 0; i < evs.length; i++) {
        var ev = evs[i];
        ev.start_date = ev.startdate || ev.est;
        ev.end_date = ev.enddate;
        ev.text = ev.name;
        ev.duration = ev.duration / 8;
        ev.open = 1;
        if (!ev.duration && !ev.end_date) ev.duration = 1;
        if (ev.predecessortasks) data.collections.links.push({
          target: ev.id,
          source: ev.predecessortasks,
          type: gantt.config.links.finish_to_start
        });
      }

      return data;
    },
    serialize: function serialize() {
      gantt.message("Serialization to 'old XML' is not implemented");
    }
  };

  gantt.serverList = function (name, array) {
    if (array) {
      this.serverList[name] = array.slice(0);
    } else if (!this.serverList[name]) {
      this.serverList[name] = [];
    }

    return this.serverList[name];
  };
};