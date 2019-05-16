'use strict';

/**
 * 监听事件
 */
class Watcher {
  constructor(id, name, handler) {
    this.id = id;
    this.name = name;
    this.handler = handler;
    this.createAt = +new Date();
  }

  // 数据更新
  notify() {
    return this.handler.exec();
  }

  // 超时
  timeout() {
    return this.handler.timeout();
  }

  // 取消监听
  unwatch() {
    return this.handler.cancel();
  }

  // 比较对象是否相同
  equals(other) {
    return other && (other.id === this.id && other.name === this.name);
  }
}

module.exports = Watcher;
