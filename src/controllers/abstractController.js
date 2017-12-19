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
    this.context = main.context;
    this.className = className;
  }

  async open() {
    if (this.model) {
      await this.model.open();
    }
  }

  async close() {
    if (this.model) {
      await this.model.close();
    }
  }

  applyMiddleware(action, params, callback = null) {
    this.todo = {};
    console.log("todo AbstractController.call");
    if (callback) {
      callback(this.todo);
    }
  }

  dispatch(className, data, originId = null) {
    this.main.getMiddlewares().dispatchEvent(className, data, originId);
  }
}
