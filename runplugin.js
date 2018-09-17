const child = require("child_process");

let ps = child.fork("./mqttclient.js");

ps.on("message", mes => {
  console.log("Message: " + JSON.stringify(mes));
  if (mes.type == "get") {
    console.log("TYPE get mes.tablename=" + mes.tablename);
    switch (mes.tablename) {
      case "params":
        ps.send({ type: "get", params: { host: "192.168.0.140", port: 1883 } });
        break;

      case "config":
        ps.send({
          type: "get",
          config: [
            { id: "1", topic: "/devices/LAMP1" },
            { id: "3", topic: "/devices/1/DD1" }
          ]
        });
        break;
        
      default:
    }
  }
});

ps.on("close", code => {
  console.log("PLUGIN CLOSED. code=" + code);
});
