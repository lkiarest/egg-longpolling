'use strict';

/**
 * 具体的请求响应执行方法
 */
class Handler {
  constructor(name, ctx, done) {
    this.name = name;
    this.ctx = ctx;
    this.done = done;
  }

  async sendRes(result) {
    const { name, ctx } = this;

    ctx.body = { ...result, name };
    ctx.status = 200;

    this.done();
  }

  // 数据更新
  async exec() {
    return this.sendRes({ update: 1 });
  }

  // 取消监听
  async cancel() {
    return this.sendRes({ cancel: 1 });
  }

  // 连接超时
  async timeout() {
    return this.sendRes({ timeout: 1 });
  }
}

module.exports = Handler;
