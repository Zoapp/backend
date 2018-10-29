/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// import chai from "chai";
import { setupLogger } from "zoapp-core";
import MiddlewaresController from "../../src/controllers/middlewares";

setupLogger("test");

jest.mock("../../src/models/middlewares");

describe("MiddlewaresController", () => {
  const defaultMiddlewares = [
    {
      id: "aaa",
      name: "md_a",
      origin: "bot1",
    },
    {
      id: "bbb",
      name: "md_b",
      origin: null,
    },
    {
      id: "ccc",
      name: "md_c",
      origin: "bot1",
    },
    {
      id: "ddd",
      name: "md_c",
      origin: "bot2",
    },
    {
      id: "eee",
      name: "md_c",
      origin: "bot1",
    },
  ];
  const pluginsControllerOnMiddlewareRegisterSpy = jest.fn();
  const mainController = {
    zoapp: {
      controllers: {
        getMiddlewares: () => ({
          dispatchEvent: () => {},
        }),
        getPluginsController: () => ({
          onMiddlewareRegister: pluginsControllerOnMiddlewareRegisterSpy,
        }),
      },
    },
  };
  afterEach(() => {
    pluginsControllerOnMiddlewareRegisterSpy.mockClear();
  });

  it("attach a middleware", async () => {
    const middlewaresController = new MiddlewaresController(
      "name",
      mainController,
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
    expect(pluginsControllerOnMiddlewareRegisterSpy).toHaveBeenCalledWith(
      middleware1,
    );
    // call register on this.model
    expect(middlewaresController.model.register).toHaveBeenCalled();
    expect(middlewaresController.attachLocally).toHaveBeenCalled();
  });

  it("get middlewares", async () => {
    const middlewaresController = new MiddlewaresController(
      "name",
      mainController,
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
  it("get middlewares by botId", async () => {
    const middlewaresController = new MiddlewaresController(
      "name",
      mainController,
      "className",
    );

    const listSpy = jest
      .spyOn(middlewaresController, "list")
      .mockReturnValueOnce([defaultMiddlewares[0], defaultMiddlewares[2]])
      .mockReturnValueOnce([defaultMiddlewares[0], defaultMiddlewares[2]])
      .mockReturnValueOnce([defaultMiddlewares[1]]);

    // Without common middlewares
    const middlewaresWithoutCommon = await middlewaresController.getMiddlewaresByBotId(
      { botId: "bot1" },
    );
    expect(listSpy).toHaveBeenCalledTimes(1);
    expect(listSpy.mock.calls[0][0]).toEqual({ origin: "bot1" });
    const idsWithoutCommon = middlewaresWithoutCommon.map(
      (middleware) => middleware.id,
    );
    expect(idsWithoutCommon).toEqual(["aaa", "ccc"]);
    listSpy.mockClear();

    // With common middlewares
    const middlewaresWithCommon = await middlewaresController.getMiddlewaresByBotId(
      {
        botId: "bot1",
        includeCommon: true,
      },
    );
    expect(listSpy).toHaveBeenCalledTimes(2);
    expect(listSpy.mock.calls[0][0]).toEqual({ origin: "bot1" });
    expect(listSpy.mock.results[0].value).toEqual([
      defaultMiddlewares[0],
      defaultMiddlewares[2],
    ]);
    expect(listSpy.mock.calls[1][0]).toEqual({ origin: null });
    expect(listSpy.mock.results[1].value).toEqual([defaultMiddlewares[1]]);

    const idsWithCommon = middlewaresWithCommon.map(
      (middleware) => middleware.id,
    );
    expect(idsWithCommon).toEqual(["aaa", "ccc", "bbb"]);
    listSpy.mockClear();
  });

  it("get middlewares names by bot id", async () => {
    const middlewaresController = new MiddlewaresController(
      "name",
      mainController,
      "className",
    );

    const availableMiddlewaresSpy = jest
      .spyOn(middlewaresController, "getMiddlewaresByBotId")
      .mockReturnValueOnce([
        defaultMiddlewares[0],
        defaultMiddlewares[2],
        defaultMiddlewares[4],
      ])
      .mockReturnValueOnce([
        defaultMiddlewares[0],
        defaultMiddlewares[2],
        defaultMiddlewares[4],
        defaultMiddlewares[1],
      ])
      .mockReturnValueOnce([defaultMiddlewares[1]]);

    let names = await middlewaresController.getMiddlewaresNamesByBotId({
      botId: "bot1",
    });
    expect(availableMiddlewaresSpy).toHaveBeenCalledTimes(1);
    expect(names).toEqual(["md_a", "md_c"]);

    names = await middlewaresController.getMiddlewaresNamesByBotId({
      botId: "bot1",
      includeCommon: true,
    });
    expect(availableMiddlewaresSpy).toHaveBeenCalledTimes(2);
    expect(names).toEqual(["md_a", "md_c", "md_b"]);
  });
});
