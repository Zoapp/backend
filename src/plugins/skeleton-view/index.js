/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the GPL v2.0+ license found in the
 * LICENSE file in the root directory of this source tree.
 */
import abstractPlugin from "../abstractPlugin";

// import { onDispatch } from "./skeletonViewMiddleware";

class SkeletonView extends abstractPlugin {
  constructor(zoapp) {
    super({
      name: "skeleton-view",
      type: "View",
      classes: [],
      title: "SkeletonView",
      icon: "message",
      // middlewares properties
      status: "disabled",
      // including default screen
      screen: {
        afterScreenId: "2",
        isDrawerItem: true,
        name: "Skeleton View",
        path: "/skeletonview",
        access: "all",
        icon: "message",
      },
    });
    this.workers = {};
    this.listener = null;
    this.zoapp = zoapp;
  }

  // legacy
  getName() {
    return this.name;
  }

  // legacy
  getType() {
    return this.type;
  }

  // legacy
  getClasses() {
    return this.classes;
  }

  setEventListener(listener) {
    this.listener = listener;
  }

  fireEvent(eventName) {
    logger.info("SkeletonView fireEvent", eventName);
    if (this.listener) {
      this.listener.fireEvent(eventName, this);
    }
  }

  // eslint-disable-next-line
  async onMiddlewareRegister(middleware) {
    const updatedMiddleware = middleware;
    logger.debug("[+] SkeletonView onMiddlewareRegister");
    // if this plugin is linked to a bot, origin/botId must be set
    if (middleware.origin) {
      // example of settings to define
      if (middleware.screen && !middleware.screen.path) {
        updatedMiddleware.screen.path = "newUrl";
      }
      // updatedMiddleware.onDispatch = onDispatch.bind(this);
    } else {
      logger.info("No origin for this plugin ", middleware.id);
    }

    return updatedMiddleware;
  }

  // eslint-disable-next-line
  async onMiddlewareUnregister(middleware) {
    logger.debug("[+] SkeletonView onMiddlewareUnRegister");
    return middleware;
  }

  // can also be set directly with abstractionPlugin Constructor
  // getMiddlewareDefaultProperties() {
  //   return {
  //     ...middlewareDefaultProperties,
  //     status: "disabled",
  //   };
  // }
}

let instance = null;

const createSkeletonViewPlugin = (zoapp) => {
  if (!instance) {
    instance = new SkeletonView(zoapp);
  }
  return instance;
};

export default createSkeletonViewPlugin;
