/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ApiError } from "zoauth-server/errors";
import CommonRoutes from "./common";
import deleteUndefined from "../utils/utilsObject";

export default class extends CommonRoutes {
  constructor(controller) {
    super(controller);

    // Actually NodeJS doesn't support ES7 arrow binding so we need to bind manually
    this.admin = this.admin.bind(this);
    this.updateAdmin = this.updateAdmin.bind(this);
    this.setup = this.setup.bind(this);
    this.getParameterValue = this.getParameterValue.bind(this);
    this.getAvailableMiddlewares = this.getAvailableMiddlewares.bind(this);
    this.getMiddlewares = this.getMiddlewares.bind(this);
    this.registerMiddleware = this.registerMiddleware.bind(this);
    this.unregisterMiddleware = this.unregisterMiddleware.bind(this);
  }

  async admin(context) {
    const me = await this.access(context);
    const scope = context.getScope();
    const clientId = context.getClientId();
    // WIP get backend parameters
    return this.controller.getAdmin().getParameters(me, clientId, scope);
  }

  async updateAdmin(context) {
    // WIP
    const me = await this.access(context);
    const scope = context.getScope();
    const clientId = context.getClientId();
    const isMaster = scope === "master";
    const isAdmin = isMaster || scope === "admin";
    if (isAdmin) {
      const params = context.getBody();
      try {
        const result = await this.controller
          .getAdmin()
          .setParameters(me, clientId, params);
        return result;
      } catch (error) {
        throw new ApiError(400, error.message);
      }
    }
    return { error: "no right to access" };
  }

  async setup(context) {
    const me = await this.access(context);
    this.params = {};
    const scope = context.getScope();
    const isMaster = scope === "master";
    // TODO
    if (me && isMaster) {
      return this.controller.getAdmin().setup();
    }
    return { todo: "admin.setup" };
  }

  async getParameterValue(context) {
    const { name, type } = context.getParams();
    const value = await this.controller
      .getAdmin()
      .getMainParameters()
      .getValue(name, type);
    if (type) {
      logger.info("TODO type parameters translate");
    }

    if (value === null) {
      throw new ApiError(404, `parameter with name ${name} does not exists`);
    }

    return value;
  }

  async getAvailableMiddlewares() {
    return this.controller.getMiddlewares().availableMiddlewares();
  }

  async getMiddlewares(context) {
    const { origin } = context.getParams();
    const { type } = context.getQuery();
    const options = deleteUndefined({ origin, type });
    return this.controller.getMiddlewares().list(options);
  }

  async registerMiddleware(context) {
    const params = context.getBody();
    return this.controller.getMiddlewares().register(params);
  }

  async unregisterMiddleware(context) {
    const { middlewareId } = context.getParams();
    return this.controller.getMiddlewares().unregister(middlewareId);
  }
}
