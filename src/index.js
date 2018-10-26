/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import createZoapp from "./zoapp";
import defaultAppConfig from "./defaultAppConfig";
import { merge } from "lodash";

const fs = require("fs");

// load config.json configuration if present.
let userConfig = {};
try {
  userConfig = JSON.parse(fs.readFileSync("config.json"));
} catch (error) {
  logger.info("No config.json file provided, falling back to default config.");
}

// merge default and user configuration
const config = merge(
  {},
  defaultAppConfig,
  userConfig, // overide with userConfig data
);

createZoapp(config).start();
