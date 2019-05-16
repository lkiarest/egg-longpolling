'use strict';

exports.keys = '123456';

/**
 * redis cache
 */
exports.redis = {
  client: {
    port: 6379,
    host: '127.0.0.1',
    password: '',
    db: 1,
  },
};

exports.longpolling = {
  subjects: [ 'test' ],
  timeout: 10,
};
