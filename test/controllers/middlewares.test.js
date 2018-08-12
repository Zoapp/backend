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
  it("attach a middleware", async () => {
    const pluginManagerRegisterSpy = jest.fn();
    const main = {
      zoapp: {
        pluginsManager: {
          register: pluginManagerRegisterSpy,
        },
      },
    };
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
});
