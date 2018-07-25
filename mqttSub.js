
const util = require('util');
const mqtt = require("mqtt");

const unitId = process.argv[2];
const unitParams = { host: "192.168.0.238", port: 1883 };

// var client = mqtt.connect({ host: "192.168.0.238", port: 1883 });
var client;

let step = 0; // Состояния плагина
let channels=[]; // массив каналов для чтения

next();

function next() {
  console.log("NEXT " + step);
  switch (step) {
    case 0: // Запрос на получение параметров
      getTable("params");
      step = 1;
      break;

    case 1: // Соединение.
      doConnect();
      step = 2;
      break;

    case 2: // Запрос на получение каналов
      getTable("config");
      step = 3;
      break;

    case 3: // Подписка на каналы
      doSubscribe();
      step = 4;
      break;

    default:
  }
}

function doConnect() {
  console.log("Start connecting...");
  client = mqtt.connect(unitParams);

  client.on("connect", function() {
    console.log("Connected!!");

    next();
  });

  client.on("message", function(topic, message) {
    // message is Buffer
    console.log(topic + " " + message.toString());
    // client.end()

    process.send({type:"data", data:[{id:topic, value:message.toString()}]});
  });
}

function doSubscribe() {
  client.subscribe("test");
  channels.forEach(item =>  {
      client.subscribe(item.id);
  });
}

/*
function sendData() {
  let robj = { type: "data", data: [] };
  for (var i = 0; i < dataArr.length; i++) {
    let int = dataArr[i].int || 1;
    values[i] = values[i] < dataArr[i].max ? values[i] + int : dataArr[i].min;
    robj.data.push({ id: dataArr[i].id, value: values[i] });
  }
  console.log(util.inspect(robj));
  process.send(robj);
}
*/


function getTable(name) {
  process.send({ type: "get", tablename: name + "/" + unitId });
}

// Сообщения от сервера
process.on("message", message => {
  if (typeof message == "object") {
    if (message.error) {
      logMsg(message.error);
      process.exit();
    }
    parseMessageFromServer(message);
  }
});

function parseMessageFromServer(message) {
  switch (message.type) {
    case "get":
      if (message.params) paramResponse(message.params);
      if (message.config) configResponse(message.config);
      break;

    case "act":
      doAct(message);
      break;
    default:
  }
}

function paramResponse(param) {
  if (typeof param == "object") {
    logMsg(util.inspect(param));
    // Взять параметры, которые нужны
    // if (param.period) unitParams.period = param.period;
    // Параметры получены -переход к соединению
  }
  next();
}

function configResponse(config) {
  if (typeof config == "object") {
    if (!util.isArray(config)) config = [config];
    logMsg(util.inspect(config));
    // Каналы получены - сформировать массив опроса и приступить к чтению
    channels = config;
  }
  next();
}

function doAct(message) {}

function logMsg(txt) {
  console.log(unitId + " " + txt);
}
