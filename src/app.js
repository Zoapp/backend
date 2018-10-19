/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { dbCreate, EmailService } from "zoapp-core";
import zoauthServer, { AuthRouter } from "zoauth-server";
import Controllers from "./controllers";
import RouteBuilder from "./routes";
import WSRouterBuilder from "./websocket";
import PluginsManager from "./plugins";

export class App {
  constructor(configuration, server = null) {
    this.configuration = { ...configuration };

    logger.info(`Start ${this.name} ${this.version}`);

    // create Database
    this.database = App.createDB(this.configuration);

    // build authConfig
    const authConfig = App.buildAuthConfig(this.configuration, this.database);

    // build endpoint
    this.endpoint = App.buildAPIEndpoint(this.configuration);

    this.server = server;
    this.authServer = App.zoauthServer(authConfig, server.app);
    this.authRouter = AuthRouter(this.authServer);

    this.controllers = App.createMainControllers(this, this.configuration);
    this.pluginsManager = PluginsManager(this, this.configuration);
    this.wsRouter = WSRouterBuilder(this);
    RouteBuilder(this);

    this.emailService = new EmailService();
  }

  get name() {
    return this.configuration.name;
  }

  get version() {
    return this.configuration.version;
  }

  get buildSchema() {
    return this.configuration.buildSchema;
  }

  /**
   * Private proxy function between App.constructor and zoauth-server. Make unit tests easier.
   */
  static zoauthServer(authConfig, serverApp) {
    return zoauthServer(authConfig, serverApp);
  }

  /**
   * Private proxy function. Make unit tests easier
   * @param {Object} app - App instance
   * @param {Object} configuration - Application configuration
   */
  static createMainControllers(app, configuration) {
    return Controllers(app, configuration);
  }

  static createDB(appConfiguration) {
    let database;
    if (appConfiguration.global && appConfiguration.global.database) {
      database = dbCreate({ ...appConfiguration.global.database });
      // logger.info("db",this.database);
    } else {
      throw new Error(
        "ConfigurationError: global database configuration not found",
      );
    }
    return database;
  }

  static buildAuthConfig(appConfiguration, database) {
    let authConfig = {};
    if (appConfiguration.auth) {
      authConfig = { ...appConfiguration.auth };
      if (database && authConfig.database.parent === "global") {
        authConfig.database.parent = database;
      }
    } else {
      throw new Error("ConfigurationError: auth configuration not found");
    }
    return authConfig;
  }

  /**
   * build the API endpoint path. Concat Api endpoint and Api version.
   * @param {object} appConfiguration -  application configuration
   */
  static buildAPIEndpoint(appConfiguration) {
    let endpoint = "";
    if (
      appConfiguration &&
      appConfiguration.global &&
      appConfiguration.global.api &&
      appConfiguration.global.api.endpoint &&
      appConfiguration.global.api.version
    ) {
      endpoint = `${appConfiguration.global.api.endpoint}/v${
        appConfiguration.global.api.version
      }`;
    } else {
      throw new Error(
        "ConfigurationError: global api endpoint configuration not found",
      );
    }
    return endpoint;
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
