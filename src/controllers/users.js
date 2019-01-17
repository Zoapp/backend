/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import AbstractController from "./abstractController";
import UsersModel from "../models/users";
import Gravatar from "../utils/gravatar";

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
    } else if (params.user && !doNotCreate) {
      // make sure user.id is valid
      profile = await this.createProfile(params.user.id);
      // await this.dispatch("updateUserProfile", profile);
    }

    if (!profile && params.id) {
      profile = await this.model.getProfile(params.id);
      if (!profile && !doNotCreate) {
        profile = await this.createProfile(params.id);
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
    let user = await this.main.getUser(userId);
    let avatar = "default";
    let profile;
    if (user) {
      const gravatar = await Gravatar.fetchGravatar(user.email);
      if (gravatar && gravatar.url) {
        avatar = gravatar.url;
      }
      user = { ...user, avatar };
      profile = await this.model.createProfile(user);
    }

    return profile;
  }

  async updateProfile(profile) {
    const updatedProfile = profile;
    if (profile.userId) {
      const user = await this.main.getUser(updatedProfile.userId);
      // Double check in order to be sure that userId in profile match user token and found user
      if (user) {
        // Then update user
        if (user.email !== updatedProfile.email) {
          updatedProfile.avatar = "reset";
        }
        user.email = updatedProfile.email;
        user.username = updatedProfile.username;
        user.password = updatedProfile.password;
        await this.main.authServer.model.setUser(user);
      }
    }
    if (!updatedProfile.avatar || updatedProfile.avatar === "reset") {
      const gravatar = await Gravatar.fetchGravatar(updatedProfile.email);
      if (gravatar && gravatar.url) {
        updatedProfile.avatar = gravatar.url;
      } else {
        updatedProfile.avatar = "default";
      }
    }
    // And finally update profile
    return this.storeProfile(updatedProfile);
  }

  async storeProfile(profile) {
    const p = await this.model.storeProfile(profile);
    // callback(p);
    if (p.id) {
      p.id = null;
    }
    return p;
  }
}
