/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import http from "http";
import express from "express";
import bodyParser from "body-parser";
import WebSocket from "ws";

class Server {
  constructor(config) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.wss = new WebSocket.Server({ server: this.server });
    this.app.options("/*", (req, res) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Content-Length, X-Requested-With, access_token, client_id, client_secret",
      );
      res.sendStatus(200);
    });
    this.config = config;
  }

  start(application) {
    this.app.use(application.endpoint, application.authRouter.expressRouter());
    const port = 8081;
    const conf = (this.config.global && this.config.global.api) || { port };
    this.server.listen(process.env.PORT || conf.port || port);
  }

  async stop() {
    clearInterval(this.wsInterval);
    return new Promise((resolve) => {
      this.server.close(() => resolve());
    });
  }
}

export default (config) => new Server(config);
