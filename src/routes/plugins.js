/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import CommonRoutes from "./common";
import deleteUndefined from "../utils/utilsObject";

class PluginsRoutes extends CommonRoutes {
  constructor(controller) {
    super(controller);

    // Actually NodeJS doesn't support ES7 arrow binding so we need to bind manually
    this.getPlugins = this.getPlugins.bind(this);
    this.getBotPlugins = this.getBotPlugins.bind(this);
    this.registerPlugin = this.registerPlugin.bind(this);
    this.deletePlugin = this.deletePlugin.bind(this);
  }

  async getPlugins(context) {
    // filter options available
    const { type, name } = context.getQuery();
    const options = deleteUndefined({ type, name });
    const pluginsController = this.controller.getPluginsController();
    const plugins = await pluginsController.apiGetPlugins(options);
    return plugins;
  }

  async getBotPlugins(context) {
    const { botId } = context.getParams();
    const pluginsController = this.controller.getPluginsController();
    return pluginsController.apiGetPluginsByBotId(botId);
  }

  async registerPlugin(context) {
    const body = context.getBody();
    const pluginsController = this.controller.getPluginsController();
    return pluginsController.apiRegisterPlugin(body);
  }

  async deletePlugin(context) {
    const { middlewareId } = context.getQuery();
    const pluginsController = this.controller.getPluginsController();
    return pluginsController.apiDeletePluginByMiddlewareId(middlewareId);
  }
}

export default PluginsRoutes;
