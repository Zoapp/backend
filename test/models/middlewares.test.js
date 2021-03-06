/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import MiddlewaresModel from "../../src/models/middlewares";

jest.mock("../../src/models/abstractModel");

describe("models - middlewares", () => {
  let middlewaresModel = null;
  let getItemsSpy = null;
  beforeAll(() => {
    middlewaresModel = new MiddlewaresModel(null, null);
    getItemsSpy = jest.fn();
    middlewaresModel.getInnerTable = () => ({ getItems: getItemsSpy });
  });
  afterEach(() => {
    getItemsSpy.mockClear();
  });

  describe("getMiddleware", () => {
    it("should get middlewares", () => {
      middlewaresModel.getMiddlewares();
      expect(getItemsSpy).toHaveBeenCalledWith(null);
    });
    it("should get middleware by origin", () => {
      middlewaresModel.getMiddlewares({ origin: "abc" });
      expect(getItemsSpy).toHaveBeenCalledWith("origin=abc");
    });
    it("should get middleware by type", () => {
      middlewaresModel.getMiddlewares({ type: "messenger" });
      expect(getItemsSpy).toHaveBeenCalledWith("type=messenger");
    });
    it("should get middleware by origin and type", () => {
      middlewaresModel.getMiddlewares({ origin: "abc", type: "messenger" });
      expect(getItemsSpy).toHaveBeenCalledWith("origin=abc AND type=messenger");
    });
    it("should get middleware by name", () => {
      middlewaresModel.getMiddlewares({ name: "websocket" });
      expect(getItemsSpy).toHaveBeenCalledWith("name=websocket");
    });
  });
});
