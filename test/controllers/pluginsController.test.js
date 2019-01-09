/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import PluginsController from "../../src/controllers/pluginsController";

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

  const defaultPlugins = [
    { ...plugin1 },
    { ...plugin2 },
    { ...plugin3 },
    { ...plugin4 },
  ];
  // avoid init adding plugins
  jest.spyOn(PluginsController.prototype, "init").mockImplementation(() => {});
  const getAvailableMiddlewaresNamesSpy = jest.fn();
  const availableMiddlewaresSpy = jest.fn();
  const getMiddlewaresByBotIdSpy = jest.fn();
  const mainController = {
    zoapp: {
      controllers: {
        getMiddlewares: () => ({
          dispatchEvent: () => {},
          getAvailableMiddlewaresNames: getAvailableMiddlewaresNamesSpy,
          availableMiddlewares: availableMiddlewaresSpy,
          getMiddlewaresByBotId: getMiddlewaresByBotIdSpy,
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

  it("get plugins by bot id", async () => {
    const middlewares = [
      { name: "plugin4", origin: null, status: "start" },
      { name: "plugin1", origin: "bot1", status: "disabled" },
      { name: "plugin3", origin: "bot1", status: "start" },
    ];

    const pluginsController = new PluginsController(
      "name",
      mainController,
      "className",
    );

    defaultPlugins.forEach((plugin) => pluginsController.add(plugin));
    expect(pluginsController.length()).toEqual(4);

    getMiddlewaresByBotIdSpy.mockReturnValue(middlewares);
    const plugins = await pluginsController.getPluginsByBotId("bot1");
    expect(getMiddlewaresByBotIdSpy).toHaveBeenCalledWith({
      botId: "bot1",
      includeCommon: true,
    });
    expect(JSON.stringify(plugins)).toEqual(
      JSON.stringify([
        {
          name: "plugin1",
          getName: () => "plugin1",
          isAvailable: true,
        },
        {
          name: "plugin2",
          isActive: true,
          getName: () => "plugin2",
        },
        {
          name: "plugin3",
          type: "messenger",
          getName: () => "plugin3",
          isAvailable: true,
          isStarted: true,
        },
        {
          name: "plugin4",
          type: "messenger",
          isActive: true,
          getName: () => "plugin4",
          isAvailable: true,
          isStarted: true,
        },
      ]),
    );
  });

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
