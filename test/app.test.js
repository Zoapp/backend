/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { App, defaultAuthConfig } from "../src/app";

// import { dbCreate, logger } from "zoapp-core";

jest.mock("zoauth-server");
jest.mock("../src/routes");

describe("App", () => {
  it("create App with configuration", () => {
    const buildDbConfigSpy = jest.spyOn(App, "buildDbConfig");
    const dbCreateSpy = jest.spyOn(App, "dbCreate");

    const buildAuthConfigSpy = jest.spyOn(App, "buildAuthConfig");

    const buildConfigSpy = jest.spyOn(App, "buildConfig");
    const configuration = JSON.parse(`
    {"name":"Opla.ai","version":"0.1.0","global":{"database":{"datatype":"mysql","host":"127.0.0.1","name":"opla_dev","user":"root","password":"","charset":"utf8mb4","version":"2"},"api":{"endpoint":"/api","version":"2","port":8081},"botSite":{"url":"/publish/"},"gateway":{"url":"https://gateway.opla.ai"}},"auth":{"database":{"parent":"global","name":"auth"},"api":{"endpoint":"/auth"}},"messenger":{"database":{"parent":"global","name":"messenger"}},"users":{"database":{"parent":"global","name":"users"}},"bots":{"database":{"parent":"global","name":"bots"}},"webhooks":{"database":{"parent":"global","name":"webhooks"}},"middlewares":{"database":{"parent":"global","name":"middlewares"}},"parameters":{"database":{"parent":"global","name":"parameters"}},"buildSchema":false}
    `);
    expect(configuration.name).toBeDefined();
    expect(configuration.global).toBeDefined();
    expect(configuration.global.database).toBeDefined();
    expect(configuration.buildSchema).toBeDefined();

    expect(configuration.api).not.toBeDefined();
    expect(configuration.global.api).toBeDefined();

    // create App
    const app = new App(configuration, {});

    expect(app.buildSchema).toEqual(false);
    expect(configuration.buildSchema).not.toBeDefined();

    // build database configuration
    expect(buildDbConfigSpy).toHaveBeenCalledWith(configuration);
    expect(dbCreateSpy).toHaveBeenCalledWith(configuration.global.database);

    expect(buildAuthConfigSpy).toHaveBeenCalledWith(configuration);
    expect(configuration.auth).toBeDefined();
    expect(buildAuthConfigSpy.mock.results[0].value).toEqual(
      configuration.auth,
    );

    expect(app.endpoint).toEqual("/api/v1");

    expect(buildConfigSpy).toHaveBeenCalled();
    expect(buildConfigSpy.mock.results[0].value).toEqual({
      ...configuration,
      buildSchema: false,
    });
  });

  it("create App without configuration", () => {
    const buildDbConfigSpy = jest.spyOn(App, "buildDbConfig");
    const dbCreateSpy = jest.spyOn(App, "dbCreate");

    const buildAuthConfigSpy = jest.spyOn(App, "buildAuthConfig");

    const buildConfigSpy = jest.spyOn(App, "buildConfig");
    const configuration = {};
    expect(configuration.name).not.toBeDefined();
    expect(configuration.global).not.toBeDefined();
    expect(configuration.buildSchema).not.toBeDefined();
    expect(configuration.api).not.toBeDefined();

    // create App
    const app = new App(configuration, {});

    expect(app.buildSchema).toEqual(true);
    expect(configuration.buildSchema).not.toBeDefined();

    // build database configuration
    expect(buildDbConfigSpy).toHaveBeenCalledWith({});
    expect(dbCreateSpy).toHaveBeenCalledWith({});
    const defaultDBconfig = {
      conf: {
        database: "opla_dev",
        dateStrings: true,
        host: "127.0.0.1",
        password: "",
        user: "root",
      },
      config: {},
      connecting: false,
      datatype: "mysql",
      dbname: "`opla_dev`",
      host: "127.0.0.1",
      lock: false,
      name: "opla_dev",
      parent: undefined,
      password: "",
      queries: {},
      rand: {
        alphabet:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      },
      url: undefined,
      user: "root",
      version: 1,
    };

    expect(dbCreateSpy.mock.results[0].value).toEqual(defaultDBconfig);

    expect(buildAuthConfigSpy).toHaveBeenCalledWith({});
    expect(configuration.auth).not.toBeDefined();

    const defaultAuthConf = {
      api: { endpoint: "/auth" },
      database: {
        name: "auth",
        parent: defaultDBconfig,
      },
    };
    expect(buildAuthConfigSpy.mock.results[0].value).toEqual(defaultAuthConf);

    expect(app.endpoint).toEqual("/api/v1");

    expect(buildConfigSpy).toHaveBeenCalledWith({}, true);

    const result = buildConfigSpy.mock.results[0].value;
    expect(result.name).toEqual("Opla.ai");

    expect(result.global.api.version).toEqual("2");
    expect(result.users.database.name).toEqual("users");
    expect(result.middlewares.database.name).toEqual("middlewares");
  });

  it("buildDbConfig", () => {
    // configuration is empty
    const resultConfig1 = App.buildDbConfig({});
    expect(resultConfig1).toEqual({});

    // configuration is not empty and doesnt have a global.database property
    const resultConfig2 = App.buildDbConfig({
      global: {},
    });
    expect(resultConfig2).toEqual(null);

    // configuration have a global.database property
    const resultConfig3 = App.buildDbConfig({
      global: {
        database: {
          foo: "bar",
        },
      },
    });
    expect(resultConfig3).toEqual({ foo: "bar" });
  });

  it("buildAuthConfig", () => {
    // configuration is empty, return defaultAuthConfig
    const resultConfig1 = App.buildAuthConfig({});
    expect(resultConfig1).toEqual(defaultAuthConfig);

    // configuration is not empty but doesnt have auth property. Return defaultAuthConfig
    const resultConfig2 = App.buildAuthConfig({ foo: {} });
    expect(resultConfig2).toEqual(defaultAuthConfig);

    // configuration have an auth property. Return the auth property content
    const resultConfig3 = App.buildAuthConfig({ auth: { foo: "bar" } });
    expect(resultConfig3).toEqual({ foo: "bar" });
  });

  it("buildConfig", () => {
    let resultConfig = {};

    resultConfig = App.buildConfig({}, false);
    expect(resultConfig.buildSchema).toEqual(false);
    resultConfig = App.buildConfig({}, true);
    expect(resultConfig.buildSchema).toEqual(true);

    // configuration is empty. Return default users conf.
    resultConfig = App.buildConfig({}, false);
    expect(resultConfig.users.database).toBeDefined();
    expect(resultConfig.middlewares.database).toBeDefined();
    expect(resultConfig.parameters.database).toBeDefined();
    expect(resultConfig.buildSchema).toEqual(false);

    // configuration define users.
    resultConfig = App.buildConfig({ users: { foo: "bar" } }, false);
    expect(resultConfig.users.foo).toBeDefined();
    expect(resultConfig.middlewares.database).toBeDefined();
    expect(resultConfig.parameters.database).toBeDefined();

    // configuration define middlewares.
    resultConfig = App.buildConfig({ middlewares: { foo: "bar" } }, false);
    expect(resultConfig.users.database).toBeDefined();
    expect(resultConfig.middlewares.foo).toBeDefined();
    expect(resultConfig.parameters.database).toBeDefined();

    // configuration define parameters
    resultConfig = App.buildConfig({ parameters: { foo: "bar" } }, false);
    expect(resultConfig.users.database).toBeDefined();
    expect(resultConfig.middlewares.database).toBeDefined();
    expect(resultConfig.parameters.foo).toBeDefined();

    // configuration define users and parameters
    resultConfig = App.buildConfig(
      { users: { foo: "bar" }, parameters: { foo: "bar" } },
      false,
    );
    expect(resultConfig.users.foo).toBeDefined();
    expect(resultConfig.middlewares.database).toBeDefined();
    expect(resultConfig.parameters.foo).toBeDefined();
  });
});
