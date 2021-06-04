/*
 * Copyright (c) 2018 Intra LLC
 * MIT LICENSE 
 * 
 * IntraHouse hardware local plugin
 * 
 * Является посредником между сервером IH и прикладной частью плагина.
 * 
 * 1. Обеспечивает связь с сервером IH и логирование
 * Методы:
 *    getFromServer
 *    sendToServer
 *    log
 *    
 * 2. Генерирует события 
 *      params - при получении от сервера параметров 
 *      config - при получении от сервера каналов
 *      extra - при получении от сервера массива extra
 *      act - при получении от сервера массива команд для каналов
 *      command - при получении от сервера произвольной команды (plugincommand)
 *      sub - при получении от сервера данных по подписке 
 * 
 */
const util = require("util");
const fs = require("fs");

exports.Plugin = Plugin;

/**
 * Plugin constructor
 *
 * @param {String || Object} params - optional
 *         String - manifest file name
 *         Object - params object
 */
function Plugin(params) {
  if (!(this instanceof Plugin)) return new Plugin(params);

  if (typeof params == "object") {
    this.params = params;
  } else if (typeof params == "string") {
    this.params = loadParamsFromManifest(params);
  } else this.params = {};

  this.loglevel = 1;

  let that = this;

  process.on("message", message => {
    if (!message) return;

    if (typeof message == "string") {
      if (message == "SIGTERM") {
        this.emit("exit");
        return;
      }
    }

    if (typeof message == "object") {
      that.parseMessageFromServer(message);
    }
  });

  process.on("uncaughtException", err => {
    this.log("ERR: uncaughtException " + util.inspect(err));
    setTimeout(() => {
      process.exit();
    }, 500);
  });
}
util.inherits(Plugin, require("events").EventEmitter);

/**
 * Setting new params value if the param exists
 * @api public
 * @param {Object} params
 */
Plugin.prototype.setParams = function(params) {
  if (typeof params == "object") {
    this.params = params;
    /*
    Object.keys(params).forEach(param => {
      if (this.params[param] != undefined) this.params[param] = params[param];
    });
    */
  }
};

Plugin.prototype.setDebug = function(mode) {
  this.debug = mode == "on" ? 1 : 0;
};

// loglevel=0 - Low (только старт-стоп и ошибки), 1 - middle, 2 - hight (все сообщ)
Plugin.prototype.log = function(txt, level) {

  if (this.loglevel < level)  return;
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

Plugin.prototype.sendCommandResponse = function(message) {
    process.send(Object.assign({ response: 1 }, message));
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
        this.log("get params: " + JSON.stringify(message.params), 1);
        this.setParams(message.params);
        this.log("set params: " + JSON.stringify(this.params), 2);
        if (message.params.debug) this.setDebug(message.params.debug);
        if (message.params.loglevel) this.loglevel = message.params.loglevel;
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
      event = "act";
      data = message.data;
      break;

    case "command":
      event = "command";
      data = message; // Здесь все сообщение!!
      break;

    case "sub":
      // get on subscribe from server
      this.log("SUB: " + util.inspect(message));
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

/* Private functions */
function loadParamsFromManifest(fileName) {
  let result = {};
  if (fs.existsSync(fileName)) {
      
    let data = JSON.parse(fs.readFileSync(fileName, "utf8"));
    if (data.params && Array.isArray(data.params)) {
      data.params.forEach(item => {
        if (item.name) result[item.name] = item.val || "";
      });
    }
  } 
  return result;
}
