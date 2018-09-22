/**
 * 
 * converter - object for convert incoming and outgoing messages (from topic to channel_id or dn and vice versa)
 * 
 *  subMap   <topic>:<channel_id> - for incoming from broker
 *          Created from channels
 *          Maps topic, getted from broker, to channel_id for IH server
 *  
 *  pubMap  <dn>:{topic, calc} - for outgoing to broker
 *          Created from extra
 *          Convert dn and value, getted from server, to topic and message for broker
 *  
 */


module.exports = {

  saveExtraGetFilter(data) {
   
    if (data && Array.isArray(data)) {
      let res = [];  
      this.extra = data;
      this.pubMap = new Map();

      // Будут добавлены только те у которых есть dn - т е для единичных объектов
      data.forEach(item => {
          if (this.addPubMapItem(item)) res.push(item.dn);
      });  
     
      return { dn: res.join(",") };
    }
   
  },

  createSubMap(channels) {
    this.subMap = new Map();
    if (!channels || !Array.isArray(channels)) return;

    channels.forEach(item => {
      if (item.id && item.topic) {
        if (!this.subMap.has(item.topic)) this.subMap.set(item.topic, []);

        this.subMap.get(item.topic).push(item.id);
      }
    });
  },

  getSubMapTopics() {
    if (this.subMap && this.subMap.size > 0)
      return [...this.subMap.keys()];
  },

  convertIncoming(topic, message) {
    if (this.subMap.has(topic)) {
      return this.subMap
        .get(topic)
        .map(id => ({ id, topic, value: message }));
    }
  },

  addPubMapItem(item) {
    if (item.id && item.topic && item.dn) {
      if (item.calc) {
        item.calcfn = new Function("value", "return " + item.calc);
      }
      if (!this.pubMap.has(item.dn)) {
          this.pubMap.set(item.dn, item);
          return true;
      }    
    }
  },

  convertOutgoing(dn, val) {
    if (!dn) return;

    if (!this.pubMap.has(dn)) {
      // Пытаемся добавить, если значение пришло впервые???
      return;
    }

    let item = this.pubMap.get(dn);
    if (!item || !item.topic) return;

    // NOT catch calcfn throw  
    let message = item.calcfn ? String(item.calcfn(val)) : String(val);
    if (message) return { topic: item.topic, message };
  }
};
