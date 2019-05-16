'use strict';

// const path = require('path');
const Polling = require('./polling');

module.exports = app => {
  app.config.coreMiddleware.push('polling');

  app.polling = new Polling(app);

  app.beforeStart(async () => {
    // await app.runSchedule(path.resolve(__dirname, 'app/schedule', 'recycle.js'));
  });
};
