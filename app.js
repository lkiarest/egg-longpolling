'use strict';
const Polling = require('./polling');

module.exports = app => {
  app.config.coreMiddleware.push('polling');

  app.messenger.once('egg-ready', () => {
    app.polling = new Polling(app);
  });

  app.messenger.on('recycle', timestamp => {
    app.polling.recycle(timestamp);
  });

  app.messenger.on('unsubscribe', id => {
    app.polling.unsubscribe(id);
  });

  app.messenger.on('publish', data => {
    app.polling.doPublish(data);
  });
};
