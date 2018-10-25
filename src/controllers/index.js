/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import UsersController from "./users";
import MiddlewaresController from "./middlewares";
import AdminController from "./admin";
import ManagementController from "./management";
import Parameters from "../models/parameters";

/**
 * Class managing the controllers.
 */
class MainController {
  /**
   *
   * Create a MainController.
   * Create and store the controllers (UsersController, MiddlewaresController etc)
   * @param {App} zoapp - The App instance.
   * @param {Object} [config={}] - The application configuration
   */
  constructor(zoapp, config = {}) {
    this.zoapp = zoapp;
    this.authServer = zoapp.authServer;
    this.config = config;
    this.database = zoapp.database;
    this.emailService = zoapp.emailService;

    this.users = new UsersController("Users", this);
    this.middlewares = new MiddlewaresController("Middlewares", this, "system");
    this.admin = new AdminController("Admin", this);
    this.management = new ManagementController("Management", this);

    this.parameters = new Parameters(this.database, this.config);
  }

  async start() {
    const { buildSchema } = this.config;

    await this.parameters.open(buildSchema);
    await this.middlewares.open();
    await this.admin.open();
    await this.users.open();
    await this.management.open();
  }

  async stop() {
    await this.admin.close();
    await this.users.close();
    await this.middlewares.close();
    await this.parameters.close();
    await this.management.close();
  }

  async isMultiProjects(userId, scope = "anonymous") {
    let multiProjects;
    if (this.config.multiProjects) {
      const mp = this.config.multiProjects;
      if (typeof mp === "object") {
        if (mp[scope]) {
          multiProjects = true;
        }
      } else {
        multiProjects = !!mp;
      }
    }
    return multiProjects;
  }

  getName() {
    return this.config.name || "";
  }

  getVersion() {
    return this.config.version || "";
  }

  getParameters() {
    return this.parameters;
  }

  async signUp(user, clientId, clientSecret = null) {
    return this.authServer.registerUser(user, clientId, clientSecret);
  }

  async authorize(user, clientId, clientSecret, scope, uniqueScope = null) {
    let sc = scope;
    if (uniqueScope) {
      // WIP check if a scope is unique
      const auths = await this.authServer.getAuthsWithScope(
        uniqueScope,
        clientId,
      );

      if (!auths || (auths && auths.length === 0)) {
        sc = uniqueScope;
      }
    }

    const payload = await this.authServer.authorizeAccess({
      username: user.username,
      password: user.password,
      user_id: user.id,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: "localhost",
      scope: sc,
    });

    if (payload.result.redirect_uri === "localhost") {
      return sc;
    }

    return null;
  }

  async getApplication(clientId) {
    return this.authServer.getApplication(clientId);
  }
  async getMe(id) {
    return this.getUser(id);
  }

  async getUser(id) {
    return this.authServer.getUser(id);
  }

  getUsers() {
    return this.users;
  }

  getManagement() {
    return this.management;
  }

  getAdmin() {
    return this.admin;
  }

  getMiddlewares() {
    return this.middlewares;
  }

  getPlugins() {
    return this.plugins;
  }
}

export default (zoapp, config) => new MainController(zoapp, config);
