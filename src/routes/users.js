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
    const profile = await this.controller
      .getUsers()
      .getProfile({ user: { id: access.user_id } });
    return Users.profile(profile);
  }

  async userProfile(context) {
    const id = context.getParams().userId;
    // TODO make sure we could access this profile
    const profile = await this.controller.getUsers().getProfile({ id });
    return Users.profile(profile);
  }

  async users(context) {
    const scope = context.getScope();

    if (scope !== "admin") {
      return [];
    }

    const me = await this.access(context);
    return this.controller.getUsers().getUsers(me);
  }

  async newProfile(context) {
    const { userId } = context.getBody();
    const profile = await this.controller.getUsers().createProfile(userId);
    if (!profile) {
      return { error: "Can't create user profile", status: 400 };
    }
    return Users.profile(profile);
  }

  async updateProfile(context) {
    let existingProfile = null;
    const isAdmin = context.getScope() === "admin";
    let { userId } = context.getParams();
    let payload = {};
    if (isAdmin && userId) {
      // This is the /userId admin call. userId should be defined
      existingProfile = await this.userProfile(context);
    } else if (!userId) {
      // This is the call for put /me. userId is not defined, so we use local context
      userId = context.res.locals.access.user_id;
      existingProfile = await this.me(context);
    }
    if (existingProfile && !existingProfile.error) {
      const updatedProfile = context.getBody();
      const result = await this.controller.getUsers().updateProfile({
        ...updatedProfile,
        userId,
      });
      payload = Users.profile(result);
    } else {
      payload = {
        error: "Can't find user profile",
        status: 400,
      };
    }
    return payload;
  }

  async deleteProfile(context) {
    this.todo = {};
    return { todo: `users.deleteProfile route ${context.req.route.path}` };
  }
}

export default Users;
