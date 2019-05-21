'use strict';

/**
 * 长连接中间件，
 * 拦截事件订阅相关的请求进行处理。
 */

module.exports = (options, app) => {
  const { basePath, subjects = [] } = app.config.longpolling;
  const subscriptionPath = `${basePath}subscription`;
  const unsubscriptionPath = `${basePath}unsubscription/`;

  // key-value 格式，方便后续处理
  const subjectMap = subjects.reduce((ret, item) => {
    if (typeof item === 'string') {
      ret[item] = { simple: true, name: item };
    } else if (Array.isArray(item) && item.length === 2) {
      ret[item[0]] = { simple: false, name: item[0], option: item[1] };
    } else {
      console.warn('longpolling subjects should be a string or an array !');
    }

    return ret;
  }, {});

  /**
   * 获取订阅 id
   * @param {Object} ctx 请求上下文
   */
  const getSubId = async ctx => {
    ctx.set('Content-Type', 'application/json');

    ctx.body = {
      id: await app.polling.genSubId(),
    };
  };

  /**
   * 取消订阅
   * @param {Object} ctx 请求上下文
   */
  const unsubscribe = async ctx => {
    const id = ctx.path.replace(unsubscriptionPath, '');

    if (isNaN(id)) {
      ctx.status = 400;
      ctx.body = `无效的订阅 id: ${id}`;
    } else {
      // 多进程模型中，需要在所有 worker 中查找 id 进行取消订阅操作
      ctx.app.messenger.sendToApp('unsubscribe', id);
      // ctx.app.polling.unsubscribe(id);
      ctx.body = { id };
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
    const subject = subjectMap[name];

    if (!subject) {
      next();
      return;
    }

    // 是否有不同客户端对资源请求不同的区分
    let resourceId = '';

    if ((!subject.simple)
      && subject.option
      && subject.option.resourceId
      && typeof subject.option.resourceId === 'function') {
      resourceId = subject.option.resourceId(ctx.query);
    }

    return app.polling.subscribe({ name: subject.name, resourceId, id, ctx }).catch(e => {
      ctx.body = e.message;
      ctx.status = 400;
    });
  };

  return async function polling(ctx, next) {
    const requestPath = ctx.path;
    if (requestPath.startsWith(basePath)) {
      // 获取订阅 id 作为后续订阅标识
      if (requestPath === subscriptionPath) {
        await getSubId(ctx);
        return;
      }

      // 取消订阅请求
      if (requestPath.startsWith(unsubscriptionPath)) {
        unsubscribe(ctx);
        return;
      }

      // 执行订阅流程
      await subscribe(ctx, next);
      return;
    }

    await next();
  };
};
