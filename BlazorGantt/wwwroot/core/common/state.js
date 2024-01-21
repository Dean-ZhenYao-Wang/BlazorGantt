var utils = require("../../utils/utils");

var StateService = function StateService() {
  var stateProviders = {};

  function getState(name) {
    var provider = stateProviders[name];

    if (provider) {
      return stateProviders[name].method();
    } else {
      var res = {};

      for (var i in stateProviders) {
        if (!stateProviders[i].internal) utils.mixin(res, stateProviders[i].method(), true);
      }

      return res;
    }
  }

  function registerProvider(name, provider, internal) {
    stateProviders[name] = {
      method: provider,
      internal: internal
    };
  }

  function unregisterProvider(name) {
    delete stateProviders[name];
  }

  return {
    getState: getState,
    registerProvider: registerProvider,
    unregisterProvider: unregisterProvider
  };
};

module.exports = StateService;