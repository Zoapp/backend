/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import AbstractController from "./abstractController";
import UsersModel from "../models/users";

export default class extends AbstractController {
  constructor(name, main) {
    super(name, main);
    this.model = new UsersModel(main.database, main.config);
  }

  async getUserProfile(id) {
    return this.model.getUserProfile(id);
  }

  async getProfile(params, doNotCreate = false) {
    let profile = null;
    if (params.user && params.user.provider && !doNotCreate) {
      const self = this;
      this.applyMiddleware("getUserProfile", params.user, async (result) => {
        profile = await self.model.storeProfile(result);
        // await self.dispatch("updateUserProfile", profile);
      });
    } else if (params.user) {
      // make sure user.id is valid
      const user = await this.main.getUser(params.user.id);
      if (user && !doNotCreate) {
        profile = await this.model.createProfile(user);
      }
      // await this.dispatch("updateUserProfile", profile);
    }

    if (!profile && params.id) {
      profile = await this.model.getProfile(params.id);
      if (!profile && !doNotCreate) {
        const user = await this.main.getUser(params.id);
        if (user) {
          profile = await this.model.createProfile(user);
        }
      }
      // await this.dispatch("updateUserProfile", profile);
    }

    return profile;
  }

  async getUsers(excludedUser) {
    let result = await this.main.authServer.getUsers();
    if (excludedUser) {
      result = result.filter((user) => user.id !== excludedUser.id);
    }

    return Promise.all(
      result.map(async (u) => {
        const user = { ...u };
        delete user.password;

        const profile = await this.getProfile({ id: user.id }, true);

        if (profile) {
          user.avatar = profile.avatar;
        }

        return user;
      }),
    );
  }

  async createProfile(userId) {
    const user = await this.main.getUser(userId);
    let profile;
    if (user) {
      profile = await this.model.createProfile(user);
    }
    return profile;
  }

  async storeProfile(profile) {
    const p = await this.model.storeProfile(profile);
    // callback(p);
    return p;
  }
}
