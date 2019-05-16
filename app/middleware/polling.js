'use strict';

/**
 * 长连接中间件，
 * 拦截事件订阅相关的请求进行处理。
 */

module.exports = (options, app) => {
  const { basePath, subjects = [] } = app.config.longpolling;
  const subscriptionPath = `${basePath}subscription`;
  const unsubscriptionPath = `${basePath}unsubscription/`;

  /**
   * 获取订阅 id
   * @param {Object} ctx 请求上下文
   */
  const getSubId = ctx => {
    ctx.body = JSON.stringify({
      id: app.polling.genSubId(),
    });
  };

  /**
   * 取消订阅
   * @param {Object} ctx 请求上下文
   */
  const unsubscribe = async ctx => {
    const id = ctx.path.replace(unsubscriptionPath);

    if (isNaN(id)) {
      ctx.status = 400;
      ctx.body = `无效的订阅 id: ${id}`;
    } else {
      await app.polling.unsubscribe(id);
    }
  };

  /**
   * 订阅事件
   * @param {Object} ctx 请求上下文
   * @param {Function} next 传递到下一个中间件处理
   */
  const subscribe = async (ctx, next) => {
    const requestPath = ctx.path;
    const matched = requestPath.match(new RegExp(`${basePath}(\\d+)\\/(\\w+)$`));
    if (!matched) {
      next();
      return;
    }

    const [ , id, name ] = matched;

    if (!subjects.includes(name)) {
      next();
      return;
    }

    return app.polling.subscribe({ name, id, ctx }).catch(e => {
      ctx.body = e.message;
      ctx.status = 400;
    });
  };

  return async function polling(ctx, next) {
    const requestPath = ctx.path;
    if (requestPath.startsWith(basePath)) {
      // 获取订阅 id 作为后续订阅标识
      if (requestPath === subscriptionPath) {
        getSubId(ctx);
        return;
      }

      // 取消订阅请求
      if (requestPath.startsWith(unsubscriptionPath)) {
        await unsubscribe(ctx);
        return;
      }

      // 执行订阅流程
      await subscribe(ctx, next);
    }

    next();
  };
};
