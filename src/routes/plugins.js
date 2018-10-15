/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import CommonRoutes from "./common";
import deleteUndefined from "../utils/utilsObject";
import PluginsController from "../controllers/pluginsController";

class PluginsRoutes extends CommonRoutes {
  constructor(controller) {
    super(controller);

    // Actually NodeJS doesn't support ES7 arrow binding so we need to bind manually
    this.getPlugins = this.getPlugins.bind(this);
    this.getBotPlugins = this.getBotPlugins.bind(this);
  }

  async getPlugins(context) {
    // filter options available
    const { type, name } = context.getQuery();
    const options = deleteUndefined({ type, name });

    return this.controller.getPluginsController().getPlugins(options);
  }

  async getBotPlugins(context) {
    const { origin } = context.getParams();
    const pluginsController = this.controller.getPluginsController();
    const plugins = await pluginsController.getPluginsByBotId(origin);
    return plugins.map((plugin) => PluginsController.getParams(plugin));
  }
}

export default PluginsRoutes;
