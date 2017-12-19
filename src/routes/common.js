/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
class CommonRoutes {
  constructor(controller) {
    this.controller = controller;
    this.todo = this.todo.bind(this);
    this.ping = this.ping.bind(this);
    this.infos = this.infos.bind(this);
  }

  async access(context) {
    // console.log("locals=" + res.locals);
    const { access } = context.res.locals;
    let me = null;
    if (access) {
      me = await this.controller.getUser(access.user_id);
    }
    return me;
  }

  todo(context) {
    this.params = {};
    return { todo: `route ${context.req.route.path}` };
  }

  ping() {
    this.params = {};
    return { ping: Date.now() };
  }

  infos() {
    this.params = {};
    return { version: this.controller.getVersion() || "0", name: this.controller.getName() || "Zoapp" };
  }
}

export default CommonRoutes;
