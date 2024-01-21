module.exports = function () {
  var services = {};

  function register(name, getter) {
    services[name] = getter;
  }

  function getService(name) {
    if (!services[name]) {
      return null;
    }

    return services[name]();
  }

  function dropService(name) {
    if (services[name]) {
      delete services[name];
    }
  }

  var servicesEnum = {};
  return {
    services: servicesEnum,
    setService: register,
    getService: getService,
    dropService: dropService,
    destructor: function destructor() {
      for (var i in services) {
        if (services[i]) {
          var service = services[i];

          if (service && service.destructor) {
            service.destructor();
          }
        }
      }

      services = null;
    }
  };
};