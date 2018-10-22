/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fetch from "node-fetch";
import AbstractController from "./abstractController";
import MiddlewareModel from "../models/middlewares";

/**
 * Class representing a middlewares controller
 */
class MiddlewaresController extends AbstractController {
  /**
   * Create a middlewares controller.
   * Create and store an instance of MiddlewareModel
   * Create an empty middlewares "list"
   * @param {string} name - The name of the controller. //Not used
   * @param {Object} main - The MainController instance.
   * @param {string} className
   */
  constructor(name, main, className) {
    super(name, main, className);
    this.model = new MiddlewareModel(main.database, main.config);
    this.middlewares = {};
  }

  /**
   * Get the list of middlewares from the DB and add them to the local middlewares list.
   */
  async open() {
    await super.open();

    const mws = await this.model.getMiddlewares();

    if (mws) {
      Promise.all(
        mws.map(async (m) => {
          await this.attachLocally(m);
        }, this),
      );
    }
  }

  /**
   * Close the model and reset the middlewares list
   */
  async close() {
    super.close();
    // TODO send a close to all middlewares
    this.middlewares = {};
  }

  /**
   * Add middleware on the middlewares list.
   *
   * Remove existing middleware with same ID if needed.
   * Call registerMiddleware on pluginsController and model.
   * Call attachLocally(m).
   * @param {Object} middleware - middleware properties object
   */
  async attach(middleware) {
    // logger.info("attach middleware=", middleware);
    let { id } = middleware; // || this.model.generateId(48);
    if (id && this.middlewares[id]) {
      // replace previous middleware
      delete this.middlewares[id];
    } else if (id && !this.middlewares[id]) {
      id = null;
    }
    let m = middleware;
    if (!m.id) {
      m.id = this.model.generateId(48);
    }
    m = await this.zoapp.controllers
      .getPluginsController()
      .onMiddlewareRegister(m);
    m = await this.model.register(m, id);
    m.onDispatch = middleware.onDispatch;
    return this.attachLocally(m);
  }

  /**
   * Add middleware on the middlewares list.
   * Dispatch a "setMiddleware" action.
   * @param {Object} m - middleware properties object
   */
  async attachLocally(m) {
    this.middlewares[m.id] = m;
    await this.dispatch(
      this.className,
      { action: "setMiddleware", m, origin: m.origin },
      m.id,
    );
    return m;
  }

  /**
   * Remove a middleware.
   * Call UnregisterMiddleware on pluginsController.
   * Dispatch a "removeMiddleware" action.
   * @param {?} middleware
   */
  async remove(middleware) {
    let ret = true;
    const { id } = middleware;
    await this.zoapp.controllers
      .getPluginsController()
      .onMiddlewareUnregister(middleware);
    // Remove the middleware from the DB.
    ret = await this.model.unregister(id);
    // Remove the middleware loccaly
    ret = this.removeLocally(id);

    await this.dispatch(
      this.className,
      { action: "removeMiddleware", middleware, origin: middleware.origin },
      middleware.id,
    );
    return ret;
  }

  async removeById(middlewareId) {
    const middleware = await this.getMiddlewareById(middlewareId);
    if (middleware) {
      return this.remove(middleware);
    }
    return { error: `No middleware found for id ${middlewareId}` };
  }

  removeLocally(middlewareId) {
    if (this.middlewares[middlewareId]) {
      // remove middleware
      delete this.middlewares[middlewareId];
      return true;
    }
    return false;
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
        match = m.classes.some((cl) => cl === className);
      }
      // logger.info("test middleware=", middleware.name, " using className=",
      // className, "match=", match);
      if (match) {
        // logger.info("dispatch middleware=", m.name, " using className=", className,
        // "from=", m.remote);
        if (!origin || (origin !== m.id && origin !== m.origin)) {
          try {
            if (m.status === "start") {
              if (m.remote) {
                const url = `${m.url + m.path}?class=${encodeURIComponent(
                  className,
                )}&secret=${encodeURIComponent(m.secret)}`;

                const response = await fetch(url, {
                  method: "POST",
                  body: JSON.stringify(data),
                  headers: { "Content-Type": "application/json" },
                });

                ret = await response.json();
                // logger.info("ret=" + ret);
              } else if (m.onDispatch) {
                // logger.info("data.origin=", data.origin, origin);
                ret = await m.onDispatch(className, data);
              }
            }
          } catch (error) {
            logger.info("error:", error);
            // middleware.status = "stop";
            // TODO stop / save / dispatch status
          }
        }
      }
    }
    return ret;
  }

  /**
   * Get middlewares list filtered by param function
   * @param {function} filterFunction
   */
  getMiddlewaresBy(filterFunction) {
    return Object.values(this.middlewares).filter(filterFunction);
  }

  getMiddlewaresByName(name) {
    return this.getMiddlewaresBy((middleware) => middleware.name === name);
  }

  getMiddlewareById(id) {
    return this.middlewares[id];
  }

  /**
   * Get middlewares available for a bot
   * Can include common middlewares
   * @param {string} botId
   * @param {boolean} includeCommon
   */
  async getMiddlewaresByBotId({ botId, includeCommon = false }) {
    const botMiddlewares = await this.list({ origin: botId });
    const commonMiddlewares = includeCommon
      ? await this.list({ origin: null })
      : [];
    return [...botMiddlewares, ...commonMiddlewares];
  }

  /**
   * Get the names of all available middlewares for a given bot.
   * Can include common middlewares
   * return an array of unique middleware names
   * @param {string} botId
   */
  async getMiddlewaresNamesByBotId({ botId, includeCommon = false }) {
    const middlewares = await this.getMiddlewaresByBotId({
      botId,
      includeCommon,
    });
    // get unique list of middleware names
    const names = new Set(middlewares.map((middleware) => middleware.name));
    return [...names];
  }

  async list(options) {
    const list = await this.model.getMiddlewares(options);
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

export default MiddlewaresController;
