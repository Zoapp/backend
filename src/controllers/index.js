/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import UsersController from "./users";
import MiddlewaresController from "./middlewares";
import AdminController from "./admin";
import Parameters from "../models/parameters";

class MainController {
  constructor(context, config) {
    this.context = context;
    this.authServer = context.authServer;
    this.config = config || {};
    this.database = context.database;
    this.users = new UsersController("Users", this);
    this.middlewares = new MiddlewaresController("Middlewares", this, "system");
    this.admin = new AdminController("Admin", this);
    this.parameters = new Parameters(this.database, this.config);
  }

  async start() {
    await this.parameters.open();
    await this.middlewares.open();
    await this.admin.open();
    await this.users.open();
  }

  async stop() {
    await this.users.close();
    await this.middlewares.close();
    await this.parameters.close();
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
      const auths = await this.authServer.getAuthsWithScope(uniqueScope, clientId);
      if (auths.length === 0) {
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

export default (context, config) => new MainController(context, config);
