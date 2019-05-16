/**
 * 定时任务，
 * 检查超时请求并回收资源
 */
'use strict';

module.exports = app => {
  return {
    schedule: {
      interval: app.config.longpolling.interval,
      type: 'worker',
      // 无可订阅主题，不启动定时器
      disable: app.config.longpolling.subjects.length === 0,
    },
    async task(ctx) {
      const { app } = ctx;
      app.polling.recycle();
    },
  };
};
