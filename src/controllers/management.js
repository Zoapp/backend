/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the GPL v2.0+ license found in the
 * LICENSE file in the root directory of this source tree.
 */
import ApiError from "zoauth-server/errors/ApiError";
import AbstractController from "./abstractController";

export default class extends AbstractController {
  constructor(name, main, className = null) {
    super(name, main, className);
    this.usersController = this.main.getUsers();
  }

  async listUsers() {
    return this.usersController.getUsers();
  }

  async createUser({ email, username, password, clientId }) {
    const resp = await this.main.signUp({
      username,
      password,
      email,
      accept: true, // hard coded to accept policy agreement not usefull on admin create user
      client_id: clientId,
    });

    if (resp === null) {
      throw new ApiError(500, "Can't create user");
    } else if (resp.error) {
      throw new ApiError(500, resp.error);
    } else if (resp.result && resp.result.error) {
      throw new ApiError(500, resp.result.error);
    }
    const userId = resp.result.id;
    // TODO Should we create the profile here? Apaprently not. To be confirmed.
    // const profile = await this.usersController.getProfile({ id: userId });

    return {
      userId,
      email,
      username,
    };
  }

  async approveUser({ userId, clientId, clientSecret, scope = "owner" }) {
    const user = await this.main.getUser(userId);
    await this.main.authorize(user, clientId, clientSecret, "owner", scope);
  }
}
