/**
 * mqttclient.js
 *   plugin - связь с сервером
 *   agent - связь с брокером
 *   store - объект для подготовки и хранения структур 
 */ 

// const util = require("util");

const libplugin = require("./lib/plugin");
const agent = require("./lib/agent");
const store = require("./lib/store");

const plugin = new libplugin.Plugin({ host: "localhost", port: 1883 });

plugin.log("Mqtt client has started.");
plugin.getFromServer("params");

plugin.on("params", () => {
  plugin.getFromServer("config");
  plugin.getFromServer("extra");

  // Можно соединиться с брокером
  agent.start(plugin);
});

plugin.on("config", data => {
  store.createTopicMap(data);
});

let currentval=0;

plugin.on("extra", data => {
    // Нужно подписаться на сервере на эти устройства, получать их значения и передавать
    // пока передаем по таймеру

    setInterval(sendData, 1000);
});

function sendData() {
    plugin.extra.forEach(item => {
        if (item.topic) {
            plugin.emit("publish", item.topic,  String(currentval));
        }
    });
    currentval = (currentval) ? 0 : 1;
}

plugin.on("connect", () => {
  // На каналы нужно подписаться - массив топиков для подписки - выделить темы
  plugin.emit("subscribe", store.getTopics());
});

/*
function next() {
  console.log("NEXT " + step);
  switch (step) {
    case 0: // Запрос на получение параметров
      getTable("params");
      step = 1;
      break;

    case 1: // Соединение с mqtt брокером
      plugin.connect();
      step = 2;
      break;

    case 2: // Запрос на получение каналов (устройства mqtt)
      getTable("config");
      step = 3;
      break;

    case 3: // Подписка на брокере на входящие каналы (устройства mqtt)
      plugin.sub();
      step = 4;
      break;

    case 4:
      // Запрос на получение списка для публикации
      getTable("extra");
      step = 5;
      break;

    case 5:
      // Подписка на ih-сервере на устройства для публикации
      doIHSub();
      step = 6;
      break;

    case 6:
      // Публиковать полученные от ih-сервера первоначально полученные значения
      // Далее будут публиковаться при изменении данных (при получении от ih-сервера по подписке)
      // doPub;
      step = 7;
      break;
    default:
  }
}

*/
