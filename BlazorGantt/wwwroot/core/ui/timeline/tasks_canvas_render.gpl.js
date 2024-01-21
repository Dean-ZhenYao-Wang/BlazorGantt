var createStaticBgHelper = function createStaticBgHelper() {
  return {
    render: function render() {},
    destroy: function destroy() {}
  };
};

module.exports = {
  create: function create() {
    return createStaticBgHelper();
  }
};