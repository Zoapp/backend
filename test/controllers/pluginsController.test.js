/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// import chai from "chai";
import { setupLogger } from "zoapp-core";
import PluginsController from "../../src/controllers/pluginsController";

setupLogger("test");

describe("PluginsController", () => {
  const plugin1 = {
    name: "plugin1",
    getName: () => "plugin1",
  };
  const plugin2 = {
    name: "plugin2",
    isActive: true,
    getName: () => "plugin2",
  };
  const plugin3 = {
    name: "plugin3",
    type: "messenger",
    getName: () => "plugin3",
  };
  const plugin4 = {
    name: "plugin4",
    type: "messenger",
    isActive: true,
    getName: () => "plugin4",
  };

  const defaultPlugins = [{ ...plugin1 }, { ...plugin2 }];
  // avoid init adding plugins
  jest.spyOn(PluginsController.prototype, "init").mockImplementation(() => {});
  const getAvailableMiddlewaresNamesSpy = jest.fn();
  const availableMiddlewaresSpy = jest.fn();
  const mainController = {
    zoapp: {
      controllers: {
        getMiddlewares: () => ({
          dispatchEvent: () => {},
          getAvailableMiddlewaresNames: getAvailableMiddlewaresNamesSpy,
          availableMiddlewares: availableMiddlewaresSpy,
        }),
      },
    },
  };

  it("Add and remove plugins to the list", () => {
    const pluginsController = new PluginsController(
      "name",
      mainController,
      "className",
    );

    expect(pluginsController.length()).toEqual(0);
    pluginsController.add(plugin1);
    expect(pluginsController.length()).toEqual(1);

    pluginsController.remove(plugin1);
    expect(pluginsController.length()).toEqual(0);
  });

  it("get plugins with filter options", () => {
    const pluginsController = new PluginsController(
      "name",
      mainController,
      "className",
    );
    pluginsController.add(plugin2);
    pluginsController.add(plugin3);
    pluginsController.add(plugin4);

    expect(pluginsController.length()).toEqual(3);

    const allPlugins = pluginsController.getPlugins();
    expect(allPlugins).toHaveLength(3);

    const messengerPlugins = pluginsController.getPlugins({
      type: "messenger",
    });
    expect(messengerPlugins).toHaveLength(2);

    const activePlugins = pluginsController.getPlugins({
      isActive: true,
    });
    expect(activePlugins).toHaveLength(2);

    const activeMessengerPlugins = pluginsController.getPlugins({
      isActive: true,
      type: "messenger",
    });
    expect(activeMessengerPlugins).toHaveLength(1);
  });

  it("get available plugins", async () => {
    const pluginsController = new PluginsController(
      "name",
      mainController,
      "className",
    );
    pluginsController.add(plugin1);
    pluginsController.add(plugin2);
    getAvailableMiddlewaresNamesSpy.mockImplementation(() => [
      "plugin1",
      "md_2",
    ]);
    const availablePlugins = await pluginsController.getAvailablePlugins(
      "bot1",
    );
    expect(pluginsController.length()).toEqual(2);
    expect(availablePlugins).toEqual([plugin1]);
  });

  it("get plugins by bot id", () => {});

  // PRIVATE FUNCTIONS

  it("plugin has a middleware", () => {
    const middlewaresWithout = [{ name: "foo" }, { name: "bar" }];
    const middlewaresWith = [...middlewaresWithout, { name: "plugin1" }];
    expect(PluginsController.hasMiddleware(plugin1, middlewaresWithout)).toBe(
      false,
    );
    expect(PluginsController.hasMiddleware(plugin1, middlewaresWith)).toBe(
      true,
    );
  });

  it("plugin has a started middleware", () => {
    const middlewaresWithout = [
      { name: "plugin1", status: "disabled" },
      { name: "plugin1", status: "random" },
      { name: "foo", status: "bar" },
    ];
    const middlewaresWith = [
      ...middlewaresWithout,
      { name: "plugin1", status: "start" },
    ];
    expect(
      PluginsController.hasStartedMiddleware(plugin1, middlewaresWithout),
    ).toBe(false);
    expect(
      PluginsController.hasStartedMiddleware(plugin1, middlewaresWith),
    ).toBe(true);
  });
});
