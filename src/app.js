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
    this.authServer = App.zoauthServer(authConfig, server.app, this);
    this.authRouter = AuthRouter(this.authServer);

    this.emailService = new EmailService();

    this.controllers = App.createMainControllers(this, this.configuration);
    this.wsRouter = WSRouterBuilder(this);
    RouteBuilder(this);
  }

  sendChangedPassword(email) {
    if (this.emailService) {
      // TODO
    }
    logger.info(`TODO sendChangedPassword ${email}`);
  }

  sendResetPassword(email) {
    if (this.emailService) {
      // TODO
    }
    logger.info(`TODO sendResetPassword ${email}`);
    return true;
  }

  sendUserCreated(email, username, validationPolicy) {
    let mailText = `Hi ${username} your account was created successfully.\n`;
    switch (validationPolicy) {
      case "admin":
        mailText +=
          "However, you should contact your administator to acctivate your account.";
        break;
      case "mail":
        mailText +=
          "To acctivate your account please click on following link.\nhttps://opla.ai";
        break;
      default:
        mailText += "Enjoy your chat bot experience !";
        break;
    }
    if (this.emailService && this.emailService.parameters) {
      const mail = {
        to: email,
        subject: "Opla account",
        text: mailText,
      };
      this.emailService.sendMessage(mail);
    }
    return true;
  }

  get name() {
    return this.configuration.name;
  }

  get version() {
    return this.configuration.version;
  }

  get buildSchema() {
    return this.configuration.build_schema;
  }

  /**
   * Private proxy function between App.constructor and zoauth-server. Make unit tests easier.
   */
  static zoauthServer(authConfig, serverApp, middleware) {
    return zoauthServer(authConfig, serverApp, middleware);
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
      const pluginsController = this.controllers.getPluginsController();
      plugins.forEach((plugin) => {
        pluginsController.add(plugin);
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
