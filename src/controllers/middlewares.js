/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import AbstractController from "./abstractController";
import MiddlewareModel from "../models/middlewares";
import fetch from "../utils/fetch";

export default class extends AbstractController {
  constructor(name, main, className) {
    super(name, main, className);
    this.model = new MiddlewareModel(main.database, main.config);
    this.middlewares = {};
  }

  async open() {
    await super.open();
    const mws = await this.model.getMiddlewares();
    if (mws) {
      mws.forEach((m) => {
        this.attachLocally(m);
      }, this);
    }
  }

  async close() {
    super.close();
    // TODO send a close to all middlewares
    this.middlewares = {};
  }

  async attach(middleware) {
    // console.log("attach middleware=", middleware);
    let { id } = middleware; // || this.model.generateId(48);
    if (id && this.middlewares[id]) {
    // replace previous middleware
      delete this.middlewares[id];
    } else if (id && (!this.middlewares[id])) {
      id = null;
    }
    let m = await this.context.pluginsManager.register(middleware);
    m = await this.model.register(m, id);
    m.onDispatch = middleware.onDispatch;
    return this.attachLocally(m);
  }

  attachLocally(m) {
    this.middlewares[m.id] = m;
    this.dispatch(this.className, { action: "setMiddleware", m, origin: m.origin }, m.id);
    return m;
  }

  async remove(middleware) {
    let ret = true;
    const m = await this.context.pluginManager.unregister(middleware);
    const { id } = m;
    ret = await this.model.unregister(id);
    if (this.middlewares[id]) {
      // remove middleware
      delete this.middlewares[id];
    } else {
      ret = false;
    }

    this.dispatch(this.className, { action: "removeMiddleware", middleware, origin: middleware.origin }, middleware.id);
    return ret;
  }

  async call(className, action, parameters, name = null) {
    let data = null;
    const keys = Object.keys(this.middlewares);
    /* eslint-disable no-restricted-syntax */
    /* eslint-disable no-await-in-loop */
    for (const id of keys) {
      const middleware = this.middlewares[id];
      if (name == null || name === middleware.name) {
        data = await middleware.call(className, action, parameters);
        if (data) {
          return true;
        }
      }
      return false;
    }
    /* eslint-disable no-restricted-syntax */
    /* eslint-disable no-await-in-loop */
    return data;
  }

  async dispatchEvent(className, data, origin = null) {
    let ret = false;
    const keys = Object.keys(this.middlewares);
    for (const id of keys) {
      const m = this.middlewares[id];
      let match = null;
      if (m.classes) {
        match = m.classes.some(cl => cl === className);
      }
      // console.log("test middleware=", middleware.name, " using className=",
      // className, "match=", match);
      if (match) {
        // console.log("dispatch middleware=", m.name, " using className=", className,
        // "from=", m.remote);
        if ((!origin) || (origin !== m.id && origin !== m.origin)) {
          try {
            if (m.status === "start") {
              if (m.remote) {
                const url = `${m.url + m.path}?class=${encodeURIComponent(className)}&secret=${encodeURIComponent(m.secret)}`;
                ret = await fetch(url, data);
                // console.log("ret=" + ret);
              } else if (m.onDispatch) {
                // console.log("data.origin=", data.origin, origin);
                ret = await m.onDispatch(className, data);
              }
            }
          } catch (error) {
            console.log("error:", error);
            // middleware.status = "stop";
            // TODO stop / save / dispatch status
          }
        }
      }
    }
    return ret;
  }

  getMiddlewareById(id) {
    return this.middlewares[id];
  }

  async availableMiddlewares() {
    // TODO
    // list all middlewares available
    this.todo = {};
    return [];
  }

  async list(origin = null, type = null) {
    const list = await this.model.getMiddlewares(origin, type);
    return list || [];
  }

  async register(middleware) {
    return this.attach(middleware);
  }

  async unregister(middlewareId) {
    let r = true;

    const mw = this.getMiddlewareById(middlewareId);
    if (mw) {
      await this.remove(mw);
    } else {
      r = false;
    }
    return r ? { result: "ok" } : { error: "can't delete item" };
  }

  async registerWebHook(webhook) {
    const w = { remote: true, type: "WebService", ...webhook };
    await this.attach(w);
    return w;
  }
}
