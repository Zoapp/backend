/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { App, defaultAuthConfig } from "../src/app";

describe("App", () => {
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
