/**
 * mqttclient.js
 * 
 */

const util = require('util');
const mqtt = require('mqtt');

// arvg[0] = node, arvg[1] = emulator.js,  arvg[2] = первый параметр -id плагина
const unitId = process.argv[2];
let unitParams = { host: "192.168.0.238", port: 1883, prefix:"villa" };

let client;
let step = 0; // Состояния плагина
let dataArr; // массив каналов для чтения
let values = []; // текущие состояния каналов

next();

function next() {
  switch (step) {
    case 0: // Запрос на получение параметров
      getTable('params');
      step = 1;
      break;

     case 1: // Соединение.
      doConnect();
      step = 2;
      break;

    case 2: // Подписка на устройства
      doSub();
      step = 3;
      break;

    case 3: // Запуск цикла
    
      step = 4;
      break;

    default:
  }
}


function doConnect() {
  console.log("Start connecting...");
  client = mqtt.connect(unitParams);

  client.on("connect", function() {
    console.log(unitId + " Connected!!");

    next();
  });

  client.on("message", function(topic, message) {
    // message is Buffer
    console.log(topic + " " + message.toString());
    // client.end()

    process.send({type:"data", data:[{id:topic, value:message.toString()}]});
  });
}


function doSub() {
    process.send({id:"main", type:"sub",event:"devices"});  // , filter:{place:1}
}



function getTable(name) {
  process.send({ type: 'get', tablename: name + '/' + unitId });
}

process.on('message', message => {
  if (typeof message == 'object') {
    if (message.error) {
      logMsg(message.error);
      process.exit();
    }
    parseMessageFromServer(message);
  }
});

function parseMessageFromServer(message) {
  switch (message.type) {
    case 'get':
      if (message.params) paramResponse(message.params);
      if (message.config) configResponse(message.config);
      break;
    case 'sub':
      console.log('SUB '+util.inspect(message)); 
      if (message.data) publishData(message.data);
      break;
    case 'act':
      doAct(message);
      break;
    default:
  }
}


function publishData(data) {
    Object.keys(data).forEach(dn => {
        client.publish(unitParams.prefix+'/'+dn, String(data[dn]));
        console.log('PUBLISH '+unitParams.prefix+'/'+dn+' '+data[dn]);
    });
}

function paramResponse(param) {
  if (typeof param == 'object') {
    logMsg(util.inspect(param));
    // Взять параметры, которые нужны

   unitParams = param;
    // Параметры получены - нужно получить список каналов для чтения
  }
  next();
}


function configResponse(config) {
  if (typeof config == 'object') {
    if (!util.isArray(config)) config = [config];
    logMsg(util.inspect(config));
    // Каналы получены - сформировать массив опроса и приступить к чтению
    dataArr = config;
    for (var i=0; i< dataArr.length; i++) { 
      values[i] = dataArr[i].first || 0;
    }  
  }
  next();
}

function doAct(message) {}

function logMsg(txt) {
  console.log(unitId + ' ' + txt);
}

