/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the GPL v2.0+ license found in the
 * LICENSE file in the root directory of this source tree.
 */
import CommonRoutes from "./common";

export default class extends CommonRoutes {
  constructor(controller) {
    super(controller);

    this.createUser = this.createUser.bind(this);
    this.listUsers = this.listUsers.bind(this);
    this.approveUser = this.approveUser.bind(this);
  }

  async listUsers() {
    return this.controller.getManagement().listUsers();
  }

  async createUser(context) {
    const {
      email,
      username,
      password,
      clientId,
      clientSecret,
    } = context.getBody();
    return this.controller
      .getManagement()
      .createUser({ email, username, password, clientId, clientSecret });
  }

  async approveUser(context) {
    const { userId, clientId, clientSecret } = context.getBody();
    return this.controller
      .getManagement()
      .approveUser({ userId, clientId, clientSecret });
  }
}
