/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import createZoapp from "./zoapp";
import defaultAppConfig from "./defaultAppConfig";

const fs = require("fs");

// load config/default.json configuration if present.
let userConfig = {};
try {
  userConfig = JSON.parse(fs.readFileSync("config/default.json"));
} catch (error) {
  logger.info("No config/default.json file provided");
}

// merge default and user configuration
const config = {
  ...defaultAppConfig,
  ...userConfig, // overide with userConfig data
};

createZoapp(config).start();
