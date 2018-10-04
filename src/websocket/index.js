/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import url from "url";

/* eslint no-param-reassign: ["error",
{ "props": true, "ignorePropertyModificationsFor": ["ws"] }] */
export class WSRouter {
  constructor(app) {
    this.app = app;
    this.routes = {};
    this.wss = this.app.server.wss;
    this.middleware = null;
  }

  start() {
    this.initMiddleware();

    const that = this;
    this.wss.on("connection", (ws, req) => {
      that.handleClientConnection(ws, req).then();
    });

    this.wss.on("error", (error) => {
      logger.error("WSS Error caught: ");
      logger.error(error.stack);
      // that.close();
      // TODO restart
    });

    this.wss.on("end", (code, reason) => {
      logger.info("WSS Connection Lost", code, reason);
      // that.close();
    });

    this.wsInterval = setInterval(() => {
      const clients = [...this.wss.clients];
      clients.forEach((ws) => {
        if (ws.isAlive === false) {
          this.closeClient(ws);
        } else {
          ws.isAlive = false;
          // logger.info("ping");
          ws.send("ping");
        }
      });
    }, 30000);
  }

  stop() {
    if (this.wsInterval) {
      clearInterval(this.wsInterval);
      this.wsInterval = null;
      this.close();
    }
  }

  close() {
    const clients = [...this.wss.clients];
    clients.forEach((ws) => {
      if (ws.isAlive) {
        this.closeClient(ws);
      }
    });
  }

  initMiddleware() {
    this.loadExistingMiddleware();

    // if middleware doesnt exist create a new one
    if (!this.middleware) {
      this.middleware = this.createMiddleware();
      this.updateMiddleware(this.middleware);
    }
  }

  loadExistingMiddleware() {
    // if a websocket middleware already exist, use it
    const middlewares = this.app.controllers
      .getMiddlewares()
      .getMiddlewaresByName("websocket");
    // if websocket middleware found
    if (middlewares.length > 0) {
      this.middleware = middlewares[0]; // eslint-disable-line
      this.middleware.onDispatch = this.onDispatch.bind(this);
    }
  }

  createMiddleware(classes = ["messenger"]) {
    return {
      name: "websocket",
      classes,
      status: "start",
      onDispatch: this.onDispatch.bind(this),
    };
  }

  updateMiddleware(middleware) {
    this.app.controllers
      .getMiddlewares()
      .attach(middleware)
      .then((m) => {
        this.middleware = m;
      });
  }

  // check if classes1 contains all classes2 items
  static areClassesIncluded(classes1, classes2) {
    return classes2.every((element) => {
      if (classes1.includes(element)) {
        return true;
      }
      return false;
    });
  }

  addMiddlewareRoute(route) {
    const { classes } = route;
    // if route.classes not present in middleware.classes -> merge classes
    if (
      this.middleware.classes &&
      classes &&
      !WSRouter.areClassesIncluded(this.middleware.classes, classes)
    ) {
      this.middleware.classes = [
        ...new Set([...classes, ...this.middleware.classes]),
      ];
      this.updateMiddleware(this.middleware);
    }
  }

  static setChannel(ws, token, routeName, channelId = null) {
    ws.token = token;
    ws.route = routeName;
    ws.channelId = channelId;
  }

  static removeChannel(ws) {
    ws.channelId = null;
  }

  static async handleClientMessage(that, ws, token, routeName, route, message) {
    let data = null;
    const m = message.trim();
    if (m.charAt(0) === "{" || m.charAt(0) === "[") {
      data = JSON.parse(m);
    } else {
      data = { event: m };
    }
    const { event, channelId } = data;
    if (event === "pong") {
      // logger.info("pong");
      ws.isAlive = true;
    } else if (event === "subscribe") {
      WSRouter.setChannel(ws, token, routeName, channelId);
      that.addMiddlewareRoute(route);
    } else if (data.event === "unsubscribe") {
      WSRouter.removeChannel(ws);
    }
    if (route.callback) {
      const cId = channelId || ws.channelId;
      const response = await route.callback(event, cId, data, ws);
      if (response) {
        ws.send(JSON.stringify(response));
      }
    }
  }

  async handleClientConnection(ws, req) {
    const location = url.parse(req.url, true);
    // TODO check access_token and route using pathname
    const routeName = location.pathname;
    const token = location.query.access_token;
    const access = await this.app.authServer.grantAccess(
      routeName,
      "WS",
      token,
    );
    if (access.result.error) {
      logger.error(
        "WS not allowed:",
        routeName,
        token,
        JSON.stringify(access.result),
      );
      this.closeClient(ws);
      return;
    }
    ws.isAlive = true;
    const route = this.routes[routeName];
    // logger.info("connected: ", routeName, route);
    ws.access = access.result;
    WSRouter.setChannel(ws, token, routeName);
    const that = this;
    ws.on("message", async (message) => {
      WSRouter.handleClientMessage(that, ws, token, routeName, route, message);
    });
    ws.on("error", (error) => {
      logger.error("WS Error caught: ");
      logger.error(error.stack);
      this.closeClient(ws);
    });

    ws.on("end", (code, reason) => {
      logger.info("WS Connection Lost", code, reason);
      this.closeClient(ws);
    });
    const response = { event: "connected" };
    ws.send(JSON.stringify(response));
  }

  onDispatch(className, data) {
    const event = data.event ? data.event : data.action;
    // logger.info("data.event=", event, data.origin);
    this.wss.clients.forEach((ws) => {
      // logger.info("ws=", ws.channelId, ws.route);
      // TODO check route classname /event
      if (ws.channelId === data.origin) {
        const routeName = ws.route;
        if (routeName) {
          const route = this.routes[routeName];
          if (route && route.callback) {
            route.callback(event, ws.channelId, data, ws).then((payload) => {
              if (payload) {
                ws.send(JSON.stringify(payload));
              }
            });
          }
        } else {
          ws.send(JSON.stringify(data));
        }
      }
    });
  }

  closeClient(ws) {
    ws.isAlive = false;
    const { route } = ws;
    if (route) {
      ws.route = null;
      ws.channelId = null;
      ws.terminate();
      let i = -1;
      const cs = this.wss.clients;
      cs.forEach((w, index) => {
        if (w.token === ws.token && w.route === route) i = index;
      });
      if (i >= 0) {
        cs.splice(i, 1);
      }
    }
  }

  on(path, scope, classes, event, callback) {
    this.app.authServer.addRoute(path, scope, "WS");
    this.routes[path] = {
      callback,
      scope,
      classes,
      event,
    };
  }

  send(path, channelId, data) {
    this.wss.clients.forEach((ws) => {
      if (ws.channelId === channelId && ws.route === path) {
        ws.send(JSON.stringify({ path, channelId, data }));
      }
    });
  }

  async getMe(ws) {
    if (ws.access) {
      const uid = ws.access.user_id;
      return this.app.authServer.getUser(uid);
    }
    return null;
  }
}

export default (app) => {
  const router = new WSRouter(app);
  return router;
};
