const child = require('child_process'); 


  let ps=child.fork('./mqttclient.js');

   ps.on('message', mes => {
      console.log('Message: '+JSON.stringify(mes));
      if (mes.type == 'get') {
        console.log('TYPE get mes.tablename='+mes.tablename);
          if (mes.tablename == 'params') {
              ps.send({type:'get', params:{host:'192.168.0.140', port:1883}});
          }
      }
    });

    ps.on('close', code => {
      console.log('PLUGIN CLOSED. code='+code);
    });

    