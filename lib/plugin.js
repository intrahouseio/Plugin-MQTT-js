/*
 * Copyright (c) 2018 Intra LLC
 *
 * MIT LICENSE 
 * 
 * intraHouse local plugin  
 * 
 */
const util = require("util");

module.exports = Plugin;

/**
 * Plugin constructor
 *
 * @param {Object} params - optional 
 * 
 */
function Plugin(params) {
  if (!(this instanceof Plugin)) return new Plugin(params);

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

/**
 * Setting new params value if the param exists 
 * @api public
 * @param {Object} params
 */
Plugin.prototype.setParams = function(params) {
  if (typeof obj == "object") {
    Object.keys(params).forEach(param => {
      if (this.params[param] != undefined) this.params[param] = params[param];
    });
  }
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
  if (util.isArray(data)) {
    process.send({ type, data });
  } else {
    process.send(Object.assign({ type }, data));
  }
};

Plugin.prototype.getFromServer = function(tablename) {
  process.send({ type: "get", tablename });
};


/**
 * @api private
 * @param {Object} message 
 * 
 * Plugin emits event if need
 */
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
  
      case "sub":
        // get on subscribe from server
        event = "sub";
        data = message.data;
  
        break;
      case "debug":
        if (message.mode) this.setDebug(message.mode);
        break;
  
      default:
    }
    if (event) this.emit(event, data);
  };
  