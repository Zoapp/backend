/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// import chai from "chai";
import MiddlewaresController from "../../src/controllers/middlewares";

jest.mock("../../src/models/middlewares");

describe("MiddlewaresController", () => {
  const pluginManagerRegisterSpy = jest.fn();
  const main = {
    zoapp: {
      pluginsManager: {
        register: pluginManagerRegisterSpy,
      },
      controllers: {
        getMiddlewares: () => ({
          dispatchEvent: () => {},
        }),
      },
    },
  };
  afterEach(() => {
    pluginManagerRegisterSpy.mockClear();
  });

  it("attach a middleware", async () => {
    const middlewaresController = new MiddlewaresController(
      "name",
      main,
      "className",
    );

    // Mock methods
    const middleware1 = {
      name: "testMiddleWare1",
    };

    middlewaresController.model.register = jest
      .fn()
      .mockReturnValue(middleware1);
    middlewaresController.model.generateId = jest
      .fn()
      .mockReturnValueOnce("1")
      .mockReturnValueOnce("2")
      .mockReturnValueOnce("3")
      .mockReturnValueOnce("4")
      .mockReturnValue("10");
    middlewaresController.attachLocally = jest.fn();

    // attache a new empty middleware
    await middlewaresController.attach(middleware1);
    // generate a new ID
    expect(middlewaresController.model.generateId).toHaveBeenCalled();
    // set the id
    expect(middleware1.id).toEqual("1");

    // call register on this.zoapp.pluginsManager.register
    expect(pluginManagerRegisterSpy).toHaveBeenCalledWith(middleware1);
    // call register on this.model
    expect(middlewaresController.model.register).toHaveBeenCalled();
    expect(middlewaresController.attachLocally).toHaveBeenCalled();
  });

  it("get middlewares", async () => {
    const middlewaresController = new MiddlewaresController(
      "name",
      main,
      "className",
    );
    await middlewaresController.attachLocally({ id: "aaa", name: "md_a" });
    await middlewaresController.attachLocally({ id: "bbb", name: "md_b" });
    await middlewaresController.attachLocally({ id: "ccc", name: "md_c" });

    // generic get middlewares
    const aMiddleware = middlewaresController.getMiddlewaresBy(
      (md) => md.name === "md_a",
    );
    expect(aMiddleware).toEqual([{ id: "aaa", name: "md_a" }]);

    // find middlewares by id
    const bbbMiddleware = middlewaresController.getMiddlewareById("bbb");
    expect(bbbMiddleware).toBeDefined();
    expect(bbbMiddleware.name).toEqual("md_b");

    // find middlewares by name
    const cccMiddleware = middlewaresController.getMiddlewaresByName("md_c");
    expect(cccMiddleware).toBeDefined();
    expect(cccMiddleware).toEqual([{ id: "ccc", name: "md_c" }]);
  });
});
