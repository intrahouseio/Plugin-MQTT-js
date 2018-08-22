/*
 * Copyright (c) 2018 Intra LLC
 *
 * MIT LICENSE 
 * 
 * Mqtt client
 */

// const util = require("util");

const defaultPluginParams = {
  host: "localhost",
  port: 1883
};

// Standard IH plugin
const plugin = require("./lib/plugin").Plugin(defaultPluginParams);

// Wraps a client connection to an MQTT broker
const agent = require("./lib/agent");

// Converts incoming and outgoing messages
const converter = require("./lib/converter");



agent.start(plugin);


plugin.log("Mqtt client has started.");
plugin.getFromServer("params");

plugin.on("params", () => {
  plugin.getFromServer("config");
  plugin.getFromServer("extra");

  // Можно соединиться с брокером
  agent.connect(plugin.params);
});

// Каналы для получения данных
plugin.on("config", data => {
  converter.createSubMap(data);
});

plugin.on("connect", () => {
  // На каналы нужно подписаться - массив топиков для подписки - выделить темы
  agent.subscribe(converter.getSubMapTopics());
});

// Массив для публикации данных
plugin.on("extra", data => {
  converter.saveExtra(data);

  // Нужно подписаться на сервере IH на эти устройства, получать их значения и передавать
  let filter = formDeviceFilter(data);
  if (filter)
    plugin.sendToServer("sub", { id: "main", event: "devices", filter });
});

plugin.on("sub", data => {
  // Получили данные от сервера по подписке - отправить брокеру
  if (!data) return;
  
  data.forEach(item => {
    try {
      let pobj = converter.convertOutgoing(item.dn, item.val);
      if (pobj) agent.publish(pobj.topic, pobj.message);
    } catch (e) {
      plugin.log("Publish error for dn="+item.dn+" value="+item.val+" : "+JSON.stringify(e));
    }
  });
});

plugin.on("act", data => {
    // Получили от сервера команду(ы) для устройства - отправить брокеру
    // Команда уже готова - там должен быть topic и message
    if (!data) return;
    
    data.forEach(item => {
      try {
        
        if (item.topic) agent.publish(item.topic, item.message || '');
      } catch (e) {
        plugin.log("Publish error act: topic="+item.topic+" message="+item.message+" : "+JSON.stringify(e));
      }
    });
  });

function formDeviceFilter(data) {
  if (!data || !Array.isArray(data)) return;
  let res = data.filter(item => item.dn).map(item => item.dn);
  if (res && res.length > 0) return { dn: res.join(",") };
}
