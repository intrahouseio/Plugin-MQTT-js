/**
 * mqttclient.js
 * 
 */

const util = require('util');


const libplugin = require("./lib/plugin");
const agent = require("./lib/agent");

const plugin = new libplugin.Plugin({host:'localhost', port:1883});

// Структуры конкретного плагина


plugin.unitId = process.argv[2];

plugin.log("Mqtt client has started.");
plugin.getFromServer("params");


plugin.on("params", () => {
     
    // Можно соединиться с брокером
    agent.start(plugin);

    plugin.getFromServer("config");
    plugin.getFromServer("extra");

});

plugin.on("config", () => {
  if (!plugin.config || !util.isArray(plugin.config)) return;

  // На каналы нужно подписаться - массив топиков для подписки - выделить темы
  plugin.emit("subscribe", plugin.config);
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


