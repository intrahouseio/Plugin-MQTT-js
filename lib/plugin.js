/**
 * plugin.js
 */
const util = require("util");
// const mqtt = require("mqtt");


exports.Plugin = Plugin;

function Plugin(params) {
  this.params = params && typeof params == "object" ? params : {};
  
  let that = this;
  process.on("message", message => {
    if (!message) return;

    if (typeof message == "string") {
      if (message == "SIGTERM") {
        process.exit();
      }
    }

    if (typeof message == "object") {
      that.parseMessageFromServer(message);
    }
  });
}
util.inherits(Plugin, require("events").EventEmitter);

Plugin.prototype.setParams = function(obj) {
    if (typeof obj == "object") {
      Object.keys(obj).forEach(param => {
        if (this.params[param] != undefined) this.params[param] = obj[param];
      });
    }
};

Plugin.prototype.parseMessageFromServer = function(message) {
  let event = "";
  let data;
  switch (message.type) {
    case "get":
      if (message.params) {
        this.setParams(message.params);
        if (message.params.debug) this.setDebug(message.params.debug);
        event = "params";
        data = this.params;
      }

      if (message.config) {
        this.log("config " + util.inspect(message.config));
        this.config = message.config;
        event = "config";
        data = this.config;
      }

      if (message.extra) {
          this.extra = message.extra;
          event = "extra";
          data = this.extra;
      }   
      break;

    case "act":
      // doAct(message);
      break;

    case "debug":
      if (message.mode) this.setDebug(message.mode);
      break;

    default:
  }
  if (event) this.emit(event, data);
};

Plugin.prototype.setDebug = function(mode) {
  this.debug = mode == "on" ? 1 : 0;
};

Plugin.prototype.log = function(txt) {
  if (this.debug) {
    process.send({ type: "debug", txt });
  } else {
    process.send({ type: "log", txt });
  }
};

Plugin.prototype.sendToServer = function(type, data) {
  process.send({ type, data });
};

Plugin.prototype.getFromServer = function(tablename) {
  process.send({ type: "get", tablename });
};
