# egg-longpolling

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-longpolling.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-longpolling
[travis-image]: https://img.shields.io/travis/eggjs/egg-longpolling.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-longpolling
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-longpolling.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-longpolling?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-longpolling.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-longpolling
[snyk-image]: https://snyk.io/test/npm/egg-longpolling/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-longpolling
[download-image]: https://img.shields.io/npm/dm/egg-longpolling.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-longpolling

提供与客户端的长连接支持。

## Install

```bash
$ npm i egg-longpolling --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.longpolling = {
  enable: true,
  package: 'egg-longpolling',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.longpolling = {
  // 可订阅的事件名称，需要在业务中调用 publish 触发此事件,支持两种格式定义：
  // 1. 简单的字符串，可直接使用 publish(eventName) 触发
  // 2. 包含资源 id 区分关心的资源，触发时需要附加参数： publish(eventName, resourceId)
  subjects: [ 'event1',  ['event2', { resourceId: ({ category }) => category }]],
  // 订阅相关的请求，如 /longpolling/1/test
  basePath: '/longpolling/',
  // 订阅连接超时时间，单位为秒
  timeout: 30,
};
```

see [config/config.default.js](config/config.default.js) for more detail.

## Example
backend:
```js
app.polling.publish('test'); // 单个事件
app.polling.publish([ 'test1', 'test2' ]); // 批量事件，只支持简单格式
app.polling.publish('complex', 'book'); // 通知只关心 book 类的资源
```

frontend:
```js
async run() {
  const {id} = await fetch('/longpolling/subscription') // response: { id: 1}
  // start to listen
  const result = await fetch('/longpolling/1/test)

  // or fetch with complex type
  // const result = await fetch('/longpolling/2/complex?category=book)

  // after event emit or timeout, will get response
  console.log(result) // { name: 'test', update: 1 } or { name: 'test', timeout: 1 }
  // TODO: start next listen ...
}
```

## Questions & Suggestions

Please open an issue [here](https://github.com/lkiarest/egg-longpolling/issues).

## License

[MIT](LICENSE)
