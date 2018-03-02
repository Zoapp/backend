/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { setupLogger } from "zoapp-core";
import ApiServer from "./server";
import App from "./app";
import Controller from "./controllers/abstractController";
import Model from "./models/abstractModel";
import CommonRoutes from "./routes/common";

const Zoapp = (config, log = "debug") => {
  setupLogger(log);
  const server = ApiServer(config);
  const app = App(config, server);

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

export { Controller, Model, CommonRoutes };
export default Zoapp;
