/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
export default class {
  constructor() {
    this.queues = {};
  }

  getMiddlewareQueue(middlewareName) {
    let middleware = this.queues[middlewareName];
    if (!middleware) {
      this.queues[middlewareName] = {};
      middleware = {};
    }
    return middleware;
  }

  register(middlewareName, name, instance) {
    const middleware = this.getMiddlewareQueue(middlewareName);
    middleware[name] = instance;
    if (typeof middleware[name].instance.init === "function") {
      middleware[name].instance.init();
    }
  }

  unregister(middlewareName, name) {
    const middleware = this.getMiddlewareQueue(middlewareName);
    if (middleware[name]) {
      if (typeof middleware[name].instance.unregister === "function") {
        middleware[name].instance.unregister();
      }
      delete middleware[name];
    }
  }

  dispatch(middlewareName, name, func, params) {
    const middleware = this.getMiddlewareQueue(middlewareName);
    if (middleware[name]) {
      if (typeof middleware[name].instance[func] === "function") {
        middleware[name].instance[func](params);
      }
    }
  }
}
