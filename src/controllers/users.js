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

  async getProfile(params) {
    let profile = null;
    if (params.user && params.user.provider) {
      const self = this;
      this.applyMiddleware("getUserProfile", params.user, async (result) => {
        profile = await self.model.storeProfile(result);
        // self.dispatch("updateUserProfile", profile);
      });
    } else if (params.user) {
      // make sure user.id is valid
      const user = await this.main.getUser(params.user.id);
      if (user) {
        profile = await this.model.createProfile(user);
      }
      // this.dispatch("updateUserProfile", profile);
    }

    if (!profile && params.id) {
      profile = await this.model.getProfile(params.id);
      if (!profile) {
        const user = await this.main.getUser(params.id);
        if (user) {
          profile = await this.model.createProfile(user);
        }
      }
      // this.dispatch("updateUserProfile", profile);
    }

    return profile;
  }

  async getUsers(excludedUser) {
    const result = await this.main.authServer.getUsers();

    return Promise.all(
      result.filter((user) => user.id !== excludedUser.id).map(async (u) => {
        const user = { ...u };
        delete user.password;

        const profile = await this.getProfile({ id: user.id });

        if (profile) {
          user.avatar = profile.avatar;
        }

        return user;
      }),
    );
  }

  async storeProfile(profile) {
    const p = await this.model.storeProfile(profile);
    // callback(p);
    return p;
  }
}
