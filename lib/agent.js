// const util = require("util");
const mqtt = require("mqtt");

const store = require("./store");

exports.start = function(plugin) {
  // Подготовить массив для подписки

  let client = mqtt.connect({
    host: plugin.params.host,
    port: plugin.params.port
  });

  plugin.log(
    "Start connecting " + plugin.params.host + " port:" + plugin.params.port
  );

  client.on("connect", () => {
    console.log(" Connected!!");
    plugin.emit("connect");
    // Если подключились - нужно подписаться, т. е. отправить на брокер массив
    /*
    client.subscribe("presence", err => {
      if (!err) {
        client.publish("presence", "Hello mqtt");
      }
    });
    */
  });

  client.on("message", (topic, message) => {
    // message is Buffer
    console.log(topic + " " + message.toString());
    // client.end()

    // plugin.sendToServer("data", [{ id: topic, value: message.toString() }]);
    let data = store.formData(topic, message.toString());
    if (data) plugin.sendToServer("data", data);
  });

  plugin.on("subscribe", topics => {
    // массив топиков или один топик - поддерживает модуль mqtt
    if (!topics) return;

    client.subscribe(topics, err => {
      if (err) {
        plugin.log("ERROR subscribing: ");
      }
    });
  });

  plugin.on("publish", (topic, message) => {
    /*
    if (typeof topics != "string" || typeof message != "string") {
      plugin.log(
        "Publish error: expected strings. topic=" +
          JSON.stringify(topic) +
          " message=" +
          JSON.stringify(topic)
      );
      return;
    }
    */

    client.publish(topic,message,  err => {
      if (err) {
        plugin.log("ERROR publishing: "+topic);
      }
    });
  })
};
