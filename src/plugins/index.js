/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// TODO remove import and use dynamic loading
import LocalTunnelPlugin from "./localtunnel";

class PluginsManager {
  constructor(zoapp, config) {
    this.zoapp = zoapp;
    this.config = config;

    this.init();
  }

  init() {
    if (this.plugins) {
      return;
    }
    this.plugins = {};
    // TODO dynamic loading
    const plugin = LocalTunnelPlugin(this);
    const name = plugin.getName();
    this.plugins[name] = plugin;
  }

  add(plugin) {
    const name = plugin.getName();
    if (name) {
      this.plugins[name] = plugin;
    }
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

  get(pluginName) {
    return this.plugins[pluginName];
  }

  async register(middleware) {
    // WIP
    const { name } = middleware;
    const plugin = this.get(name);
    // logger.info("register", plugin, name);
    // logger.info("register", plugin.getName());
    if (plugin) {
      return plugin.register(middleware);
    }
    return middleware;
  }

  async unregister(middleware) {
    // WIP
    const { name } = middleware;
    const plugin = this.get(name);
    if (plugin) {
      return plugin.unregister(middleware);
    }
    return middleware;
  }
}
export default (authServer, config) => new PluginsManager(authServer, config);
