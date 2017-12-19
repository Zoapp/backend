/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import ApiServer from "./server";
import App from "./app";

const Zoapp = (config) => {
  const server = ApiServer(config);
  const app = App(config, server);

  const shutdown = () => {
    const close = async () => {
      await app.close();
      console.log("Closed out remaining connections / services.");
      process.exit(0);
    };
    close();
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return app;
};

export default Zoapp;

