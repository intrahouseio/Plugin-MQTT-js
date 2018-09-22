/**
 * Wraps a client connection to an MQTT broker
 */

const util = require("util");
const mqtt = require("mqtt");

exports.Agent = Agent;

/**
 * Agent constructor
 *
 *
 */
function Agent(params) {
  if (!(this instanceof Agent)) return new Agent(params);
}
util.inherits(Agent, require("events").EventEmitter);

Agent.prototype.connect = function({
  host,
  port,
  use_password = false,
  username = "",
  password = ""
}) {
  if (!host) {
    this.emit("error", "MQTT host not defined!");
    return;
  }
  if (!port) port = 1883;

  let options = { host, port };
  let authStr = "";
  if (use_password) {
    Object.assign(options, { username, password });
    authStr = "username=" + username;
  }
  this.emit("log", "Start connecting " + host + ":" + port + " " + authStr, 1);

  this.client = mqtt.connect(options);

  this.client.on("connect", () => {
    this.emit("connect");
  });

  this.client.on("offline", () => {
    this.emit("offline");
  });

  this.client.on("packetsend", packet => {
    this.emit("log", "Packet send. cmd:" + packet.cmd, 2);
  });

  this.client.on("packetreceive", packet => {
    this.emit("log", "Packet receive. cmd: " + packet.cmd, 2);
  });

  this.client.on("message", (topic, message) => {
    this.emit("data", topic, message);
  });

  this.client.on("error", err => {
    this.emit("log", "Connection error " + JSON.stringify(err));
  });
};

Agent.prototype.subscribe = function(topics) {
  if (!topics) return;

  this.client.subscribe(topics, err => {
    if (err) {
      this.emit("log", "ERROR subscribing: ");
    }
  });
};

Agent.prototype.publish = function(topic, message) {
  if (!topic || !message) return;

  this.emit("log", "PUBLISH: " + topic + " " + message, 2);

  this.client.publish(topic, message, err => {
    if (err) {
      this.emit("log", "ERROR publishing: " + topic);
    }
  });
};

Agent.prototype.end = function() {
  if (this.client) this.client.end();
};
