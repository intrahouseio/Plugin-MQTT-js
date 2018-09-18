/**
 * Wraps a client connection to an MQTT broker
 */

const util = require("util");

const mqtt = require("mqtt");

// const converter = require("./converter");

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

Agent.prototype.connect = function({ host, port }) {
  this.emit("log", "Start connecting " + host + ":" + port);

  this.client = mqtt.connect({ host, port });

  this.client.on("connect", () => {
    this.emit("connect");
  });

  this.client.on("offline", () => {
    this.emit("offline");
  });

  this.client.on("packetsend", packet => {
    this.emit("log", "Packet send. cmd:" + packet.cmd);
  });

  this.client.on("packetreceive", packet => {
    this.emit("log", "Packet receive. cmd: " + packet.cmd);
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

  this.emit("log", "PUBLISH: " + topic + " " + message);

  this.client.publish(topic, message, err => {
    if (err) {
      this.emit("log", "ERROR publishing: " + topic);
    }
  });
};
