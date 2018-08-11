/**
 * Wraps a client connection to an MQTT broker
 */

const mqtt = require("mqtt");

const converter = require("./converter");

module.exports = {

  start(plugin) {
    this.plugin = plugin;
  },

  connect({host, port}) {
    this.plugin.log("Start connecting " + host + ":" + port);

    this.client = mqtt.connect({ host, port });

    this.client.on("connect", () => {
      this.plugin.log("Connected!!");
      this.plugin.emit("connect");
    });

    this.client.on("message", (topic, message) => {
      let data = converter.convertIncoming(topic, message.toString());
      if (data) this.plugin.sendToServer("data", data);
    });

    this.client.on("error", (err) => {
        this.plugin.log("Connection error "+JSON.stringify(err));
    });
  },

  subscribe(topics) {
    if (!topics) return;

    this.client.subscribe(topics, err => {
      if (err) {
        this.plugin.log("ERROR subscribing: ");
      }
    });
  },

  publish(topic, message) {
    if (!topic || !message) return;

    console.log('Publish '+topic+' '+message);
    this.client.publish(topic, message, err => {
      if (err) {
        this.plugin.log("ERROR publishing: " + topic);
      }
    });
  }
};
