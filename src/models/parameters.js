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

  getInnerTable() {
    return this.database.getTable("parameters");
  }

  queryValue(name, collection = this.getInnerTable()) {
    const query = `name=${name}`;
    // console.log("query", query);
    return collection.getItem(query);
  }

  async getValue(name, collection = this.getInnerTable()) {
    const item = await this.queryValue(name, collection);
    // console.log("getValue", item);
    if (item && item.value) {
      return item.value;
    }
    return null;
  }

  async setValue(name, value, collection = this.getInnerTable()) {
    const prev = await this.queryValue(name, collection);
    // console.log("setValue prev=", prev);
    const item = { name, value: { ...value } };
    let id = null;
    if (prev) {
      ({ id } = prev);
      item.id = id;
    } else {
      item.id = this.generateId(48);
    }
    // console.log("setValue", JSON.stringify(item));
    return collection.setItem(id, item);
  }
}
