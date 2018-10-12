/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import AbstractModel from "./abstractModel";
import descriptor from "../schemas/users.json";

export default class extends AbstractModel {
  constructor(database, config) {
    super("users", database, config, descriptor);
  }

  async countAll(collection = this.getInnerTable()) {
    return collection.size();
  }

  async getUserProfile(id, profiles = this.getInnerTable("profiles")) {
    return profiles.getItem(`userId=${id}`);
  }

  async getProfile(id, profiles = this.getInnerTable("profiles")) {
    let profile = await profiles.getItem(id);
    if (!profile) {
      profile = await this.getUserProfile(id, profiles);
    }
    return profile;
  }

  async createProfile(user, profiles = this.getInnerTable("profiles")) {
    let profile = await profiles.getItem(`userId=${user.id}`);
    if (!profile) {
      // Create a minimal profile from user's informations
      profile = {
        id: this.generateId(),
        username: user.username,
        email: user.email,
        creation_date: user.creation_date,
        userId: user.id,
        avatar: user.avatar || "default",
      };
      await profiles.setItem(null, profile);
    }
    return profile;
  }

  async storeProfile(profile, profiles = this.getInnerTable("profiles")) {
    const p = await profiles.getItem(profile.id);
    let id = null;
    if (p) {
      ({ id } = profile);
    }
    await profiles.setItem(id, profile);
  }
}
