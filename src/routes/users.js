/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import CommonRoutes from "./common";

class Users extends CommonRoutes {
  constructor(controller) {
    super(controller);

    // Actually NodeJS doesn't support ES7 arrow binding so we need to bind manually
    this.me = this.me.bind(this);
    this.userProfile = this.userProfile.bind(this);
    this.users = this.users.bind(this);
    this.newProfile = this.newProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.deleteProfile = this.deleteProfile.bind(this);
  }

  static profile(profile) {
    let payload = null;
    let status = 200;
    if (profile) {
      payload = {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        avatar: profile.avatar,
        firstname: profile.firstname,
        lastname: profile.lastname,
        gender: profile.gender,
        timezone: profile.timezone,
        locale: profile.locale,
        provider: profile.provider,
      };
    } else {
      status = 400;
      payload = { error: "Can't find user's informations", status };
    }
    return payload;
  }

  async me(context) {
    const { access } = context.res.locals;
    const profile = await this.controller.getUsers().getProfile({ user: { id: access.user_id } });
    return Users.profile(profile);
  }

  async userProfile(context) {
    const id = context.getParams().userId;
    // TODO make sure we could access this profile
    const profile = await this.controller.getUsers().getProfile({ id });
    return Users.profile(profile);
  }

  async users(context) {
    this.todo = {};
    return { todo: `users.users route ${context.req.route.path}` };
  }

  async newProfile(context) {
    this.todo = {};
    return { todo: `users.newProfile route ${context.req.route.path}` };
  }

  async updateProfile(context) {
    this.todo = {};
    return { todo: `users.updateProfile route ${context.req.route.path}` };
  }

  async deleteProfile(context) {
    this.todo = {};
    return { todo: `users.deleteProfile route ${context.req.route.path}` };
  }
}

export default Users;
