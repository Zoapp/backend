/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { setupLogger } from "zoapp-core";
import createApiServer from "./server";
import createApp from "./app";
import Controller from "./controllers/abstractController";
import Model from "./models/abstractModel";
import CommonRoutes from "./routes/common";
import defaultAppConfig from "./defaultAppConfig";
import _ from "lodash";

const createZoapp = (configOverride, log = "debug") => {
  setupLogger(log);
  const config = createConfig(configOverride, process.env);
  const server = createApiServer(config);
  const app = createApp(config, server);

  const shutdown = () => {
    const close = async () => {
      await app.close();
      logger.info("Closed out remaining connections / services.");
      process.exit(0);
    };
    close();
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return app;
};

const createConfig = (configOverride, env) => {
  // Config priority is :
  // 1. Environment vars starting with ZOAPP_
  // 2. Config in configOverride
  // 3. Fallback to ./defaultAppConfig
  let finalConfig = defaultAppConfig;
  finalConfig = _.merge({}, finalConfig, configOverride);
  for (const envKey in _.pickBy(env, (v, k) => k.startsWith("ZOAPP__"))) {
    if (env.hasOwnProperty(envKey)) {
      const splittedKey = envKey.split("__").splice(1);
      _.set(finalConfig, splittedKey.join(".").toLowerCase(), env[envKey]);
    }
  }
  return finalConfig;
};

export { Controller, Model, CommonRoutes, defaultAppConfig, createConfig };

export default createZoapp;
