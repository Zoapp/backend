/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Abstract class representing a controller
 * @property {string} name
 * @property {Object} main - the MainController instance
 * @property {Object} zoapp - the App instance
 * @property {string} className
 */
class AbstractController {
  /**
   * Set the controller properties.
   * @param {string} name - The controller name
   * @param {Object} main - The MainController instance
   * @param {Object} main.zoapp - The App instance
   * @param {string} className
   */
  constructor(name, main, className = null) {
    this.name = name;
    this.main = main;
    this.zoapp = main.zoapp;
    this.className = className;
  }

  async open() {
    if (this.model) {
      const { build_schema } = this.main.config;

      await this.model.open(build_schema);
    }
  }

  async close() {
    if (this.model) {
      await this.model.close();
    }
  }

  applyMiddleware(action, params, callback = null) {
    this.todo = {};
    if (callback) {
      callback(this.todo);
    }
  }

  async dispatch(className, data, originId = null) {
    return this.zoapp.controllers
      .getMiddlewares()
      .dispatchEvent(className, data, originId);
  }

  getMainParameters() {
    return this.main.getParameters();
  }

  getEmailService() {
    return this.main.emailService;
  }
}

export default AbstractController;
