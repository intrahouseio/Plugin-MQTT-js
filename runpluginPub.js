/**
 * Mock server for publish operation
 */

const child = require("child_process");

let ps = child.fork("./mqttclient.js");

let currentval = 0;
let subdevs;

ps.on("message", mes => {
  console.log("Message: " + JSON.stringify(mes));
  if (mes.type == "get") {

    switch (mes.tablename) {
      case "params":
        ps.send({ type: "get", params: { host: "192.168.0.140", port: 1883 } });
        break;

      case "extra":
        ps.send({
          type: "get",
          extra: [
            { id: "1", topic: "/devices/LAMP1", dn: "LAMP1", calc:"(value) ? 'ON' : 'OFF'" },
            { id: "3", topic: "/devices/1/DD1", dn: "DD1" }
          ]
        });
        break;

      default:
    }
  }

  if (mes.type == "sub") {
    console.log("TYPE sub mes.filter.dn=" + mes.filter.dn);
    if (mes.filter && mes.filter.dn) {
      subdevs = mes.filter.dn.split(",");
      setInterval(sendData, 1000);
    }
  }
});

ps.on("close", code => {
  console.log("PLUGIN CLOSED. code=" + code);
});

function sendData() {
  subdevs.forEach(dn => {
    ps.send({ type: "sub", event: "devices", data: [{ dn, val: currentval }] });
  });
  currentval = currentval ? 0 : 1;
}
