'use strict';

/**
 * egg-longpolling default config
 */
exports.longpolling = {
  basePath: '/longpolling/', // 订阅相关的请求前缀，如 /longpolling/1/test
  subjects: [], // 可订阅的事件名称，需要在业务中调用 publish 触发此事件
  timeout: 30, // 订阅连接超时时间，单位为秒
  interval: '20s', // 定期超时检查的频率，默认没 20 秒检查一次
};
