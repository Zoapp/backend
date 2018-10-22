/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import localtunnel from "localtunnel";
import AbstractPlugin from "../abstractPlugin";

class LocalTunnel extends AbstractPlugin {
  constructor() {
    super("localtunnel", null, "TunnelProvider", [], null);
    this.tunnel = null;
    this.listener = null;
  }

  getName() {
    return this.name;
  }

  getType() {
    return this.type;
  }

  setEventListener(listener) {
    this.listener = listener;
  }

  fireEvent(eventName) {
    // logger.info("LocalTunnel fireEvent", eventName);
    if (this.listener) {
      this.listener.fireEvent(eventName, this);
    }
  }

  async registerMiddleware(params) {
    // WIP
    const { port, ...options } = params;
    return new Promise((resolve, reject) => {
      try {
        this.tunnel = localtunnel(port, options, (err) => {
          if (err) {
            reject(err);
            this.fireEvent("error");
          } else {
            // the assigned public url for your tunnel
            // i.e. https://abcdefgjhij.localtunnel.me
            resolve(this.tunnel.url);
            this.fireEvent("open");
          }
        });
        this.tunnel.on("close", () => {
          this.tunnel = null;
          this.fireEvent("close");
        });
      } catch (e) {
        logger.info("Exception in localtunnel TODO restart", e);
      }
    });
  }

  async unregisterMiddleware() {
    return new Promise((resolve) => {
      if (this.tunnel) {
        this.tunnel.close();
      }
      resolve();
    });
  }
}

let instance = null;

const LocalTunnelPlugin = () => {
  if (!instance) {
    instance = new LocalTunnel();
  }
  return instance;
};

export default LocalTunnelPlugin;
