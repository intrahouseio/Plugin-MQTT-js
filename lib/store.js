/**
 * store.js
 *   Подготовка и хранение структур
 *
 */

const util = require("util");

module.exports = {
  start() {},

  createTopicMap(channels) {
    this.topicMap = new Map();
    if (!channels || !util.isArray(channels)) return;

    channels.forEach(item => {
      if (item.id && item.topic) {
        if (!this.topicMap.has(item.topic)) this.topicMap.set(item.topic, []);

        this.topicMap.get(item.topic).push(item.id);
      }
    });
  },

  getTopics() {
      if (this.topicMap && this.topicMap.size>0) return [...this.topicMap.keys()];
  },

  formData(topic, message) {
    console.log('formData '+topic);
      if (this.topicMap.has(topic)) {
        return this.topicMap.get(topic).map(id => ({id, topic, value:message})) ;
      }
  }
};
