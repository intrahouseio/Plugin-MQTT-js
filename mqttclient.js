/*
 * Copyright (c) 2018 Intra LLC
 *
 * MIT LICENSE
 *
 * Mqtt client
 */

const util = require('util');
const path = require('path');

/*
const defaultPluginParams = {
  host: "localhost",
  port: 1883,

};
*/

// Standard IH plugin
const manifest = path.join(__dirname, 'mqttclient.json');
const plugin = require('./lib/plugin').Plugin(manifest);

// Wraps a client connection to an MQTT broker
const agent = require('./lib/agent').Agent();

// Converts incoming and outgoing messages
const converter = require('./lib/converter');

plugin.log('Mqtt client has started.', 0);
plugin.getFromServer('params');

/* Plugin event listeners */
plugin.on('params', () => {
  plugin.getFromServer('config');
  plugin.getFromServer('extra');

  // Можно соединиться с брокером
  agent.connect(plugin.params);
});

// Каналы для получения данных
plugin.on('config', data => {
  converter.createSubMap(data);
});

// Массив для публикации данных
plugin.on('extra', data => {
  if (!data || !Array.isArray(data)) {
    // plugin.log("Publish settings (extra array) missing or invalid!");
    return;
  }

  // Нужно подписаться на сервере IH на эти устройства, получать их значения и передавать
  let filter = converter.saveExtraGetFilter(data);
  // let filter = formDeviceFilter(data);
  if (filter) plugin.sendToServer('sub', { id: 'main', event: 'devices', filter });
});

plugin.on('sub', data => {
  // Получили данные от сервера по подписке - отправить брокеру
  if (!data) return;

  data.forEach(item => {
    try {
      let pobj = converter.convertOutgoing(item.dn, item.val);
      if (pobj) agent.publish(pobj.topic, pobj.message);
    } catch (e) {
      logError(e, `Publish dn=${item.dn} value=${item.val}`);
    }
  });
});

plugin.on('act', data => {
  // Получили от сервера команду(ы) для устройства - отправить брокеру
  // Команда уже готова - там должен быть topic и message
  if (!data) return;

  data.forEach(item => {
    try {
      if (item.topic) {
        if (item.act == 'set' && (!item.message || item.message == 'value')) item.message = String(item.value);
        agent.publish(item.topic, item.message || '');
      }
    } catch (e) {
      logError(e, `Publish topic ${item.topic} message ${item.message}`);
    }
  });
});

plugin.on('command', message => {
  // Получили от сервера сообщение {type:'command', command:'publish', data:{topic, message}}
  if (!message) return;
  let data;
  switch (message.command) {
    case 'publish': // Команда на прямую публикацию
      if (!message.data) return plugin.log('Not found data: ' + util.inspect(message));
      if (typeof message.data != 'object') return plugin.log('Invalid data: ' + util.inspect(message));

      data = !Array.isArray(message.data) ? [message.data] : message.data;
      data.forEach(item => {
        try {
          if (item.topic) agent.publish(item.topic, item.message || '');
        } catch (e) {
          logError(e, `Publish topic ${item.topic} message ${item.message}`);
        }
      });
      break;
    default:
      plugin.log('Missing or invalid command! Expected command:publish!');
  }
});

plugin.on('exit', () => {
  processExit(0);
});

/* Agent event listeners */
agent.on('connect', () => {
  plugin.log('Connected!!', 1);

  // На каналы нужно подписаться - массив топиков для подписки - выделить темы
  let topics = converter.getSubMapTopics();
  plugin.log('Subscribe on  ' + util.inspect(topics), 1);
  agent.subscribe(topics);
});

agent.on('offline', () => {
  plugin.log('offline', 1);
});

agent.on('log', (text, level) => {
  plugin.log(text, level);
});

agent.on('data', (topic, message) => {
  message = message.toString();
  plugin.log('GET: ' + topic + ' ' + message, 1);

  if (converter.startsceneMap.has(topic)) {
    converter.startsceneMap.get(topic).forEach(item => {
      process.send({ type: 'startscene', id: item, arg: { topic, message } });
    });
  }

  let data = converter.convertIncoming(topic, message);
  // plugin.log('SEND topic: ' + topic + 'data:' + util.inspect(data), 1);
  if (data) {
    // Если value - это объект и нужно извлекать время - в каждом элементе извлечь время
    if (plugin.params.extract_ts && plugin.params.ts_field) processTimestamp(data);
    plugin.sendToServer('data', data);
  }
});

function processTimestamp(data) {
  const ts_field = plugin.params.ts_field;
  data.forEach(item => {
    if (item.value) {
      try {
        let vobj = JSON.parse(item.value);
        if (vobj[ts_field]) {
          item.ts = new Date(vobj.ts).getTime();
        }

      } catch(e) {
        plugin.log('Time process error, expected JSON with "'+ts_field+'" property');
      }
    }
  })
}

// Фатальная ошибка - выход плагина
agent.on('error', txt => {
  processExit(1, txt);
});

/* Private functions */
function logError(err, txt = '') {
  plugin.log(txt + ' ERROR! ' + JSON.stringify(err));
}

function processExit(errcode = 0, txt = '') {
  //  Close connection
  agent.end();

  if (txt) plugin.log(txt);
  setTimeout(() => {
    process.exit(errcode);
  }, 300);
}
