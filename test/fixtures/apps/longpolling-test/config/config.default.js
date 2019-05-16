'use strict';

exports.keys = '123456';

exports.longpolling = {
  subjects: [ 'test', [ 'complex', { resourceId: ({ username }) => username }]],
  timeout: 10,
};
