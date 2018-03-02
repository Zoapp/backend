/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import AbstractModel from "./abstractModel";
import descriptor from "../schemas/middlewares.json";

export default class extends AbstractModel {
  constructor(database, config) {
    super("middlewares", database, config, descriptor);
  }

  async getMiddlewares(origin = null, type = null) {
    const collection = this.getInnerTable();
    let query = origin ? `origin=${origin}` : null;
    if (type) {
      query = query ? `${query} AND ` : "";
      query += `type=${type}`;
    }
    return collection.getItems(query);
  }

  static isType(middleware, type) {
    if (middleware.types) {
      return middleware.types.some((t) => t === type);
    }
    return false;
  }

  async register(middleware, mId = null) {
    const collection = this.getInnerTable();
    let md = null;
    let id = null;
    let lmid = mId;
    if (mId) {
      id = mId;
    } else {
      ({ id } = middleware);
      md = await collection.getItem(
        `name=${middleware.name} AND origin=${middleware.origin}`,
      );
      if (md && (!md.secret || md.secret === middleware.secret)) {
        lmid = md.id;
        ({ id } = md);
      }
      if (!id) {
        id = this.generateId(48);
      }
    }
    md = { id, ...middleware };
    if (!md.status) {
      md.status = "start";
    }
    await collection.setItem(lmid, md);
    return md;
  }

  async unregister(middlewareId) {
    const collection = this.getInnerTable();
    return collection.deleteItem(middlewareId);
  }
}
