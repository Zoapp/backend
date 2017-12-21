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
    const that = this;
    this.wss.on("connection", (ws, req) => {
      that.startClient(ws, req).then();
    });

    this.wss.on("error", (error) => {
      console.log("Error caught: ");
      console.log(error.stack);
      // that.close();
      // TODO restart
    });

    this.wss.on("end", (code, reason) => {
      console.log("Connection Lost", code, reason);
      // that.close();
    });

    this.wsInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          WSRouter.closeClient(ws);
        } else {
          ws.isAlive = false;
          // console.log("ping");
          ws.send("ping");
        }
      });
    }, 30000);
  }

  stop() {
    this.close();
  }

  close() {
    this.wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        WSRouter.closeClient(ws);
      }
    });
  }
  static setChannel(ws, routeName, channelId = null) {
    ws.route = routeName;
    ws.channelId = channelId;
  }

  static removeChannel(ws) {
    ws.channelId = null;
  }

  async startClient(ws, req) {
    const location = url.parse(req.url, true);
    // TODO check access_token and route using pathname
    const routeName = location.pathname;
    const token = location.query.access_token;
    const access = await this.app.authServer.grantAccess(routeName, "WS", token);
    if (access.result.error) {
      console.log("WS not allowed:", routeName, token, JSON.stringify(access.result));
      WSRouter.closeClient(ws);
      return;
    }
    ws.isAlive = true;
    const route = this.routes[routeName];
    console.log("connected: ", routeName, route);
    ws.access = access.result;
    WSRouter.setChannel(ws, routeName);
    const that = this;
    ws.on("message", async (message) => {
      let data = null;
      const m = message.trim();
      if (m.charAt(0) === "{" || m.charAt(0) === "[") {
        data = JSON.parse(m);
      } else {
        data = { event: m };
      }
      const { event, channelId } = data;
      if (event === "pong") {
        // console.log("pong");
        ws.isAlive = true;
      } else if (event === "subscribe") {
        WSRouter.setChannel(ws, routeName, channelId);
        if (that.middleware) {
          console.log("TODO merge WS middleware");
        } else {
          const onDispatch = (className, d) => {
            that.onDispatch(className, { event: route.event, ...d });
          };
          that.middleware = that.app.controllers.getMiddlewares().attach({
            name: "websocket", classes: route.classes, status: "start", onDispatch,
          });
        }
      } else if (data.event === "unsubscribe") {
        WSRouter.removeChannel(ws);
        that.app.controllers.getMiddlewares().remove(that.middleware);
      }
      if (route.callback) {
        const response = await route.callback(event, channelId, data, ws);
        if (response) {
          ws.send(JSON.stringify(response));
        }
      }
    });
    ws.on("error", (error) => {
      console.log("Error caught: ");
      console.log(error.stack);
      WSRouter.closeClient(ws);
    });

    ws.on("end", (code, reason) => {
      console.log("Connection Lost", code, reason);
      WSRouter.closeClient(ws);
    });
    const response = { event: "connected" };
    ws.send(JSON.stringify(response));
  }

  onDispatch(className, data) {
    console.log("data.event=", data.event, data.origin);
    this.wss.clients.forEach((ws) => {
      // TODO check route classname /event
      if (ws.channelId === data.origin) {
        const routeName = ws.route;
        if (routeName) {
          const route = this.routes[routeName];
          if (route && route.callback) {
            route.callback(data.event, ws.channelId, data, ws).then((payload) => {
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

  static closeClient(ws) {
    if (ws.route) {
      ws.route = null;
      ws.channelId = null;
      ws.terminate();
    }
  }

  on(path, scope, classes, event, callback) {
    this.app.authServer.addRoute(path, scope, "WS");
    this.routes[path] = {
      callback, scope, classes, event,
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
