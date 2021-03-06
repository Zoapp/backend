/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { dbCreate } from "zoapp-core";

export default class {
  constructor(name, parentDatabase, config, descriptor = null) {
    this.name = name;
    this.config = config;
    // Init model
    const conf = config[name];
    if (conf && conf.database) {
      const dbConfig = { ...conf.database };
      if (parentDatabase && dbConfig.parent === "global") {
        dbConfig.parent = parentDatabase;
        if (!dbConfig.name) {
          dbConfig.name = name;
        }
      }
      if (descriptor) {
        dbConfig.descriptor = descriptor;
      } else if (conf.descriptor) {
        dbConfig.descriptor = conf.descriptor;
      }
      this.database = dbCreate(dbConfig);
    } else if (parentDatabase) {
      this.database = parentDatabase;
    } else {
      this.database = dbCreate({});
    }
  }

  getInnerTable(name = this.name) {
    return this.database.getTable(name);
  }

  generateId(length = 32) {
    return this.database.generateToken(length);
  }

  async open(buildSchema = true) {
    const ok = !!this.database;
    if (ok) {
      await this.database.load(buildSchema);
    }
  }

  async close() {
    if (this.datatabase) {
      await this.database.close();
    }
  }
}
