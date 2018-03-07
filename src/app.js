/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { dbCreate } from "zoapp-core";
import zoauthServer, { AuthRouter } from "zoauth-server";
import Controllers from "./controllers";
import RouteBuilder from "./routes";
import WSRouterBuilder from "./websocket";
import PluginsManager from "./plugins";

class App {
  constructor(configuration = {}, server = null) {
    this.name = configuration.name || "Zoapp backend";
    this.version = configuration.version || "";
    this.buildSchema =
      configuration.buildSchema !== undefined
        ? !!configuration.buildSchema
        : true;

    logger.info(`Start ${this.name} ${this.version}`);

    const configEmpty = Object.keys(configuration).length === 0 ? {} : null;
    let globalDbConfig = null;
    if (
      (configuration.global && configuration.global.database) ||
      configEmpty
    ) {
      globalDbConfig = configEmpty || configuration.global.database;
    }
    if (globalDbConfig) {
      this.database = dbCreate(globalDbConfig);
      // logger.info("db",this.database);
    }
    let authConfig = {};
    if (configuration.auth) {
      authConfig = { ...configuration.auth };
    } else {
      authConfig = {
        database: {
          parent: "global",
          name: "auth",
        },
        api: {
          endpoint: "/auth",
        },
      };
    }
    if (this.database && authConfig.database.parent === "global") {
      authConfig.database.parent = this.database;
    }

    const endpoint = "/api/v1";
    const conf = configuration.api || { endpoint };
    this.endpoint = conf.endpoint || endpoint;

    this.server = server;
    this.authServer = zoauthServer(authConfig, server.app);
    this.authRouter = AuthRouter(this.authServer);

    const cfg = {
      ...configuration,
      buildSchema: this.buildSchema,
    };

    if (!cfg.users) {
      cfg.users = {
        database: {
          parent: "global",
          name: "users",
        },
      };
    }
    if (!cfg.middlewares) {
      cfg.middlewares = {
        database: {
          parent: "global",
          name: "middlewares",
        },
      };
    }
    if (!cfg.parameters) {
      cfg.parameters = {
        database: {
          parent: "global",
          name: "parameters",
        },
      };
    }
    this.controllers = Controllers(this, cfg);
    this.pluginsManager = PluginsManager(this, cfg);
    this.wsRouter = WSRouterBuilder(this);
    RouteBuilder(this);
  }

  createRoute(path) {
    return this.authRouter.createRoute(path);
  }

  addWSRoute(path, scope, classes, event, callback) {
    this.wsRouter.on(path, scope, classes, event, callback);
  }

  addControllerExtensions(controllerExt) {
    this.extensions = controllerExt;
  }

  addPlugins(plugins) {
    if (plugins) {
      plugins.forEach((plugin) => {
        this.pluginsManager.add(plugin);
      });
    }
  }

  async start() {
    if (this.database) {
      await this.database.load(this.buildSchema);
    }
    if (this.authServer) {
      await this.authServer.start();
    }
    if (this.server) {
      await this.server.start(this);
    }
    await this.controllers.start();
    if (this.extensions) {
      await this.extensions.start();
    }
    if (this.wsRouter) {
      await this.wsRouter.start();
    }
  }

  async close() {
    logger.info(`Stop ${this.name}`);
    if (this.wsRouter) {
      await this.wsRouter.stop();
    }
    if (this.server) {
      await this.server.stop(this);
    }
    if (this.extensions) {
      await this.extensions.stop();
    }
    await this.controllers.stop();
    if (this.authServer) {
      await this.authServer.stop();
    }
    if (this.database) {
      await this.database.close();
    }
  }
}

export default (config = {}, server = null) => new App(config, server);
