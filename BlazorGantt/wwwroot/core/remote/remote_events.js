var remote_client = require("remote-client");

module.exports = {
  remoteEvents: function remoteEvents(url, token) {
    var _this = this;

    var remote = new remote_client.Client({
      url: url,
      token: token
    }); // temporary patch, as we do not want credentials

    remote.fetch = function (url, body) {
      var req = {
        headers: this.headers()
      };

      if (body) {
        req.method = "POST";
        req.body = body;
      }

      return fetch(url, req).then(function (res) {
        return res.json();
      });
    };

    this._ready = remote.load().then(function (back) {
      return _this._remote = back;
    });

    function ready() {
      return this._ready;
    }

    function on(name, handler) {
      this.ready().then(function (back) {
        if (typeof name === "string") back.on(name, handler);else {
          for (var key in name) {
            back.on(key, name[key]);
          }
        }
      });
    }

    this.ready = ready;
    this.on = on;
  }
};