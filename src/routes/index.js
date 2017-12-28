/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import AdminRoutes from "./admin";
import UsersRoutes from "./users";
import CommonRoutes from "./common";

export default (zoapp) => {
  const common = new CommonRoutes(zoapp.controllers);
  const admin = new AdminRoutes(zoapp.controllers);
  const users = new UsersRoutes(zoapp.controllers);

  // / routes
  let route = zoapp.createRoute("/");
  route.add("GET", "ping", ["open", "admin"], common.ping);
  route.add("GET", "", ["open", "admin"], common.infos);
  // /me linked to /users/me route
  route.add("GET", "me", ["*", "admin", "master"], users.me);

  // /users routes
  route = zoapp.createRoute("/users");
  route.add("GET", "/me", ["*", "admin", "master"], users.me);
  route.add("GET", "", ["admin", "master"], users.users);
  route.add("GET", "/:userId", ["admin", "master"], users.userProfile);
  route.add("POST", "", ["admin", "master"], users.newProfile);
  route.add("PUT", "/:userId", ["*", "admin", "master"], users.updateProfile);
  route.add("DELETE", "/:userId", ["admin", "master"], users.deleteProfile);

  // /admin routes
  route = zoapp.createRoute("/admin");
  route.add("GET", "", ["owner", "admin", "master"], admin.admin);
  route.add("PUT", "", ["owner", "admin", "master"], admin.updateAdmin);
  route.add("GET", "/setup", ["master"], admin.setup);

  // /middlewares routes
  route = zoapp.createRoute("/middlewares");
  route.add("GET", "", ["owner", "admin", "master"], admin.getAvailableMiddlewares);
  route.add("GET", "/:origin", ["owner", "admin", "master"], admin.getMiddlewares);
  route.add("POST", "/:origin", ["owner", "admin", "master"], admin.registerMiddleware);
  route.add("PUT", "/:origin", ["owner", "admin", "master"], admin.registerMiddleware);
  route.add("POST", "", ["owner", "admin", "master"], admin.registerMiddleware);
  route.add("PUT", "", ["owner", "admin", "master"], admin.registerMiddleware);
  route.add("DELETE", "/:middlewareId", ["owner", "admin", "master"], admin.unregisterMiddleware);
  route.add("DELETE", "/:origin/:middlewareId", ["owner", "admin", "master"], admin.unregisterMiddleware);

  // /parameters routes
  route = zoapp.createRoute("/params");
  route.add("GET", "/:name", ["owner", "admin", "master"], admin.getParameterValue);
  route.add("GET", "/:name/:type", ["owner", "admin", "master"], admin.getParameterValue);
};
