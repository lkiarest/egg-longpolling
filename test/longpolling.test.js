'use strict';

const path = require('path');
const mock = require('egg-mock');
const assert = require('assert');

describe('test/longpolling.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/longpolling-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      .expect('hi, longpolling')
      .expect(200);
  });

  it('should GET /longpolling/subscription', () => {
    return app.httpRequest()
      .get('/longpolling/subscription?appKey=xxx')
      .expect(JSON.stringify({ id: 1 }))
      .expect(200);
  });

  it('should GET /longpolling/1/test', () => {
    setTimeout(() => {
      app.polling.publish([ 'test' ]);
    }, 2000);

    return app.httpRequest()
      .get('/longpolling/1/test?appKey=xxx')
      .expect(200)
      .expect(res => {
        assert.deepEqual(res.body, { name: 'test', update: 1 });
      });
  });

  it('should fail with duplicate subscription', () => {
    return app.httpRequest()
      .get('/longpolling/1/test?appKey=xxx')
      .expect(400)
      .expect('重复订阅事件: test');
  });

  it('should GET with duplicate subscription', () => {
    return app.httpRequest()
      .get('/longpolling/1/test?appKey=xxx')
      .expect(400)
      .expect('重复订阅事件: test');
  });

  it('should GET timeout without event', () => {
    setTimeout(() => {
      app.runSchedule(path.resolve(__dirname, '../app/schedule', 'recycle.js'));
    }, 20000);

    return app.httpRequest()
      .get('/longpolling/2/test?appKey=xxx')
      .expect(200)
      .expect(res => {
        assert.deepEqual(res.body, { name: 'test', timeout: 1 });
      });
  });
});
