'use strict';

const { Controller } = require('egg');

class HomeController extends Controller {
  async index() {
    this.ctx.body = 'hi, ' + this.app.plugins.longpolling.name;
  }
}

module.exports = HomeController;
