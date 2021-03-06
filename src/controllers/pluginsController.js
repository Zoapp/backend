/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// TODO remove import and use dynamic loading
import LocalTunnelPlugin from "../plugins/localtunnel";
import AbstractController from "./abstractController";
import createSkeletonViewPlugin from "../plugins/skeleton-view";

/**
 * PluginsController has two roles:
 *  - store plugins object instances used by backend
 *  - Do the bridge/proxy between plugins and middleware for the API
 */
class PluginsController extends AbstractController {
  /**
   * Create a middlewares controller.
   * Create and store an instance of MiddlewareModel
   * Create an empty middlewares "list"
   * @param {string} name - The name of the controller. //Not used
   * @param {Object} main - The MainController instance.
   * @param {string} className
   */
  constructor(name, main, className = "system") {
    super(name, main, className);
    this.plugins = {};

    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
    this.length = this.length.bind(this);
    this.init();
  }

  init() {
    if (this.length > 0) {
      return;
    }
    // TODO dynamic loading
    const plugin = LocalTunnelPlugin(this);
    this.add(plugin);
    this.add(createSkeletonViewPlugin(this.main.zoapp));
  }

  add(plugin) {
    const name = plugin.getName();
    if (name) {
      this.plugins[name] = plugin;
    }
  }

  remove(plugin) {
    const name = plugin.getName();
    if (name) {
      delete this.plugins[name];
    }
  }

  length() {
    return Object.keys(this.plugins).length;
  }

  /**
   * Extract params object from plugin object and associate middleware
   * Used for API response
   * @param {object} plugin
   */
  static getProperties(plugin, middleware) {
    return {
      ...plugin.properties,
      middleware,
    };
  }

  getPluginsNameList(type) {
    const list = [];
    Object.keys(this.plugins).forEach((name) => {
      const plugin = this.plugins[name];
      if (plugin.getType() === type) {
        list.push({ name });
      }
    });
    return list;
  }

  /**
   * private function
   * return true if plugin has a middleware with same name
   * @param {object} plugin
   * @param {array} middlewares
   */
  static hasMiddleware(plugin, middlewares) {
    return middlewares.some((middleware) => middleware.name === plugin.name);
  }

  /**
   * private function
   * return true if plugin has a started middleware with same name
   * @param {object} plugin
   * @param {array} middlewares
   */
  static hasStartedMiddleware(plugin, middlewares) {
    return middlewares.some(
      (middleware) =>
        middleware.name === plugin.name && middleware.status === "start",
    );
  }

  async getPluginsByBotId(botId) {
    const middlewareController = this.zoapp.controllers.getMiddlewares();
    const middlewares = await middlewareController.getMiddlewaresByBotId({
      botId,
      includeCommon: true,
    });
    const orgPlugins = this.getPlugins();

    const plugins = orgPlugins.map((plugin) => {
      const newPlugin = { ...plugin };
      if (PluginsController.hasMiddleware(plugin, middlewares)) {
        newPlugin.isAvailable = true;
        if (PluginsController.hasStartedMiddleware(plugin, middlewares)) {
          newPlugin.isStarted = true;
        }
      }
      return newPlugin;
    });
    return plugins;
  }

  getPlugins(options = {}) {
    let plugins = Object.values(this.plugins);
    Object.keys(options).forEach((element) => {
      plugins = plugins.filter(
        (plugin) => plugin[element] === options[element],
      );
    });
    return plugins;
  }

  get(pluginName) {
    return this.plugins[pluginName];
  }

  getPlugin(pluginName) {
    return this.get(pluginName);
  }

  /**
   * Proxy function
   * @param {object} pluginData - data set in the plugin middleware
   */
  async registerPlugin(pluginData) {
    return this.zoapp.controllers.getMiddlewares().register(pluginData);
  }

  // API interface methods.

  async apiGetPluginsByBotId(botId) {
    const middlewareController = this.zoapp.controllers.getMiddlewares();
    const middlewares = await middlewareController.getMiddlewaresByBotId({
      botId,
      includeCommon: true,
    });

    const orgPlugins = this.getPlugins();
    const pluginsResponse = orgPlugins.map((plugin) => {
      const pluginMiddlewares = middlewares.filter(
        (md) => md.name === plugin.name,
      );
      return {
        ...plugin.properties,
        middlewares: pluginMiddlewares,
      };
    });

    return pluginsResponse;
  }

  async apiRegisterPlugin(plugin) {
    const defaultMiddleware = this.getPlugin(
      plugin.name,
    ).getMiddlewareDefaultProperties();

    const newMiddleware = {
      ...defaultMiddleware,
      ...plugin.middleware, // override with received data
    };

    const result = await this.zoapp.controllers
      .getMiddlewares()
      .register(newMiddleware);
    // return plugin wih registered middleware
    return { ...plugin, middleware: result };
  }

  async apiGetPlugins(options) {
    const plugins = this.getPlugins(options);
    const pluginsProperties = plugins.map((plugin) => plugin.properties);
    return pluginsProperties;
  }

  async apiDeletePluginByMiddlewareId(middlewareId) {
    const middlewareController = this.zoapp.controllers.getMiddlewares();
    return middlewareController.removeById(middlewareId);
  }

  /**
   * Register a middleware.
   * If there is a plugin with the same name has the middleware, it will call his onMiddlewareRegister(middleware) method.
   * @param {Object} middleware - middleware properties object
   */
  async onMiddlewareRegister(middleware) {
    // WIP
    const { name } = middleware;
    const plugin = this.get(name);
    // logger.info("register", plugin, name);
    // logger.info("register", plugin.getName());
    if (plugin && typeof plugin.onMiddlewareRegister === "function") {
      return plugin.onMiddlewareRegister(middleware);
    }
    return middleware;
  }

  async onMiddlewareUnregister(middleware) {
    // WIP
    const { name } = middleware;
    const plugin = this.get(name);
    if (plugin && typeof plugin.onMiddlewareUnregister === "function") {
      return plugin.onMiddlewareUnregister(middleware);
    }
    return middleware;
  }
}

export default PluginsController;
