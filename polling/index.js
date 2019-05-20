'use strict';

const Handler = require('./handler');
const Watcher = require('./watcher');

/**
 * 此模块管理所有客户端的长连接
 */
class Polling {
  constructor(app) {
    this.watchers = [];
    this.app = app;
    this.subId = 1;
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
  async unsubscribe(id) {
    if (typeof id === 'undefined') {
      this.watchers.forEach(watcher => watcher.unwatch());
      this.watchers = [];
      return;
    }

    const { watchers } = this;
    for (let i = watchers.length - 1; i >= 0; i--) {
      if (watchers[i].id === id) {
        await watchers[i].unwatch();
        watchers.splice(i, 1);
      }
    }

  }

  /**
   * 事件触发
   * @param {String} name 事件名称
   * @param {String} resourceId 请求资源的唯一标识
   */
  async publish(name, resourceId = '') {
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
  genSubId() {
    return this.subId++;
  }

  /**
   * 检查超时请求并回收资源
   */
  async recycle() {
    const { watchers, app } = this;
    const timeout = app.config.longpolling.timeout * 1000;
    const now = +new Date();

    for (let i = watchers.length - 1; i >= 0; i--) {
      const watcher = watchers[i];

      if (now - watcher.createAt >= timeout) {
        await watcher.timeout();
        watchers.splice(i, 1);
      }
    }
  }
}

module.exports = Polling;
