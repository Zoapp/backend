/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
export default class {
  constructor(name, main, className = null) {
    this.name = name;
    this.main = main;
    this.zoapp = main.zoapp;
    this.className = className;
  }

  async open() {
    if (this.model) {
      const { buildSchema } = this.main.config;

      await this.model.open(buildSchema);
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
}
