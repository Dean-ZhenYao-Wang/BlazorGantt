var DataProcessor = require("./data_processor");

module.exports = {
  DEPRECATED_api: function DEPRECATED_api(server) {
    return new DataProcessor.DataProcessor(server);
  },
  createDataProcessor: DataProcessor.createDataProcessor,
  getDataProcessorModes: DataProcessor.getAvailableModes
};