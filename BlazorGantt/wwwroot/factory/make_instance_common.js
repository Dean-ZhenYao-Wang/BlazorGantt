function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function DHXGantt() {
  this.constants = require("../constants");
  this.templates = {};
  this.ext = {};
  this.keys = {
    edit_save: this.constants.KEY_CODES.ENTER,
    edit_cancel: this.constants.KEY_CODES.ESC
  };
}

module.exports = function (supportedExtensions) {
  // use a named constructor to make gantt instance discoverable in heap snapshots
  var gantt = new DHXGantt();

  var ExtensionManager = require("../ext/extension_manager")["default"];

  var extensionManager = new ExtensionManager(supportedExtensions);
  var activePlugins = {};

  gantt.plugins = function (config) {
    for (var i in config) {
      if (config[i] && !activePlugins[i]) {
        var plugin = extensionManager.getExtension(i);

        if (plugin) {
          plugin(gantt);
          activePlugins[i] = true;
        }
      }
    }

    return activePlugins;
  };

  gantt.$services = require("../core/common/services")();
  gantt.config = require("../core/common/config")();
  gantt.ajax = require("../core/common/ajax")(gantt);
  gantt.date = require("../core/common/date")(gantt);
  gantt.RemoteEvents = require("../core/remote/remote_events").remoteEvents;

  var dnd = require("../core/common/dnd")(gantt);

  gantt.$services.setService("dnd", function () {
    return dnd;
  });

  var templatesLoader = require("../core/common/templates")(gantt);

  gantt.$services.setService("templateLoader", function () {
    return templatesLoader;
  });

  require("../utils/eventable")(gantt);

  var StateService = require("../core/common/state");

  var stateService = new StateService();
  stateService.registerProvider("global", function () {
    var res = {
      min_date: gantt._min_date,
      max_date: gantt._max_date,
      selected_task: null
    }; // do not throw error if getState called from non-initialized gantt

    if (gantt.$data && gantt.$data.tasksStore) {
      res.selected_task = gantt.$data.tasksStore.getSelectedId();
    }

    return res;
  });
  gantt.getState = stateService.getState;
  gantt.$services.setService("state", function () {
    return stateService;
  });

  var utils = require("../utils/utils");

  utils.mixin(gantt, utils);
  gantt.Promise = require("../utils/promise");
  gantt.env = require("../utils/env");

  require("../core/datastore/datastore_hooks")(gantt);

  var DataProcessor = require("../core/dataprocessor");

  gantt.dataProcessor = DataProcessor.DEPRECATED_api;
  gantt.createDataProcessor = DataProcessor.createDataProcessor;

  require("../core/plugins")(gantt);

  require("../core/dynamic_loading")(gantt);

  require("../core/grid_column_api")(gantt);

  require("../core/tasks")(gantt);

  require("../core/load")(gantt);

  require("../core/worktime/work_time")(gantt);

  require("../core/data")(gantt);

  require("../publish_helpers/void_script_second")["default"](gantt);

  require("../core/data_task_types")(gantt);

  require("../core/cached_functions")(gantt);

  require("../core/gantt_core")(gantt);

  require("../core/destructor")(gantt);

  require("../publish_helpers/void_script_third")["default"](gantt);

  var i18n = require("../locale")["default"]();

  gantt.i18n = {
    addLocale: i18n.addLocale,
    setLocale: function setLocale(locale) {
      if (typeof locale === "string") {
        var localeObject = i18n.getLocale(locale);

        if (!localeObject) {
          localeObject = i18n.getLocale("en");
        }

        gantt.locale = localeObject;
      } else if (locale) {
        if (!gantt.locale) {
          gantt.locale = locale;
        } else {
          for (var i in locale) {
            if (locale[i] && _typeof(locale[i]) === "object") {
              if (!gantt.locale[i]) {
                gantt.locale[i] = {};
              }

              gantt.mixin(gantt.locale[i], locale[i], true);
            } else {
              gantt.locale[i] = locale[i];
            }
          }
        }
      }
    },
    getLocale: i18n.getLocale
  };
  gantt.i18n.setLocale("en");
  return gantt;
};