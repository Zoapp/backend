/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import AbstractModel from "./abstractModel";
import descriptor from "../schemas/parameters.json";

export default class extends AbstractModel {
  constructor(database, config) {
    super("parameters", database, config, descriptor);
  }

  queryValue(name, type, collection = this.getInnerTable()) {
    const query = `name=${name} AND type=${type}`;
    // logger.info("query", query);
    return collection.getItem(query);
  }

  async getValue(name, type = null, collection = this.getInnerTable()) {
    const item = await this.queryValue(name, type, collection);
    // logger.info("getValue", item);
    if (item && item.value) {
      return item.value;
    }
    return null;
  }

  async setValue(name, value, type = null, collection = this.getInnerTable()) {
    const prev = await this.queryValue(name, type, collection);
    // logger.info("setValue prev=", prev);
    const item = { name, value: { ...value }, type };
    let id = null;
    if (prev) {
      ({ id } = prev);
      item.id = id;
    } else {
      item.id = this.generateId(48);
    }
    // logger.info("setValue", JSON.stringify(item));
    return collection.setItem(id, item);
  }

  async generateName(
    length = 4,
    type = null,
    collection = this.getInnerTable(),
  ) {
    let name = null;
    let prev = null;
    /* eslint-disable no-await-in-loop */
    do {
      name = this.database.generateToken(length);
      prev = await this.queryValue(name, type, collection);
    } while (prev);
    /* eslint-enable no-await-in-loop */
    return name;
  }
}
