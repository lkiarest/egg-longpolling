'use strict';

const Handler = require('./handler');
const Watcher = require('./watcher');

const REDIS_ID_KEY = 'EGG_LONG_POLLING_ID';
const START_ID = 1;

/**
 * 此模块管理所有客户端的长连接
 */
class Polling {
  constructor(app) {
    this.watchers = [];
    this.app = app;
  }

  /**
   * 订阅事件
   * @param {Object} param0 订阅事件所需信息
   */
  async subscribe({ id, name, resourceId, ctx }) {
    // 此客户端重复注册同样的事件
    if (this.watchers.some(watcher => watcher.equals({ id, name }))) {
      return Promise.reject(new Error(`重复订阅事件: ${name}`));
    }

    // redis.subscribe(name, new Handler(fn, ctx));
    const p = new Promise(resolve => this.watchers.push(new Watcher({
      id, name, resourceId, handler: new Handler(name, ctx, resolve),
    })));

    return p;
  }

  /**
   * 取消订阅，若无参数则取消所有订阅事件
   * @param {String} id 订阅 id
   */
  unsubscribe(id) {
    if (typeof id === 'undefined') {
      this.watchers.forEach(watcher => watcher.unwatch());
      this.watchers = [];
      return { id };
    }

    const { watchers } = this;
    for (let i = watchers.length - 1; i >= 0; i--) {
      if (watchers[i].id === id) {
        watchers[i].unwatch();
        watchers.splice(i, 1);
      }
    }

    return { id };
  }

  async publish(name, resourceId = '') {
    this.app.messenger.sendToApp('publish', { name, resourceId });
  }

  /**
   * 执行数据更新通知
   * @param {Object} param0 更新所需参数
   */
  async doPublish({ name, resourceId = '' }) {
    if (Array.isArray(name)) {
      name.forEach(item => this.publish(item));
      return;
    }

    const { watchers } = this;

    for (let i = watchers.length - 1; i >= 0; i--) {
      const watcher = watchers[i];

      if (watcher.name === name && watcher.resourceId === resourceId) {
        await watcher.notify();
        watchers.splice(i, 1);
      }
    }
  }

  /**
   * 生成订阅id，作为客户端的唯一标识，方便批量管理
   */
  async genSubId() {
    const { redis } = this.app;

    let id = await redis.get(REDIS_ID_KEY)

    id = id ? (+id) + 1 : START_ID;

    await redis.set(REDIS_ID_KEY, id);
    return id;
  }

  /**
   * 检查超时请求并回收资源
   * @param { Number } timestamp 当前时间的时间戳
   */
  async recycle(timestamp) {
    const { watchers, app } = this;
    const timeout = app.config.longpolling.timeout * 1000;

    for (let i = watchers.length - 1; i >= 0; i--) {
      const watcher = watchers[i];

      if (timestamp - watcher.createAt >= timeout) {
        await watcher.timeout();
        watchers.splice(i, 1);
      }
    }
  }
}

module.exports = Polling;
