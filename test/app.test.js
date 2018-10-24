/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { App } from "../src/app";
import defaultAppConfig from "../src/defaultAppConfig";

jest.mock("zoauth-server");
jest.mock("../src/routes");

describe("App", () => {
  const defaultTestConfiguration = JSON.parse(`
    {"name":"Opla.ai","version":"0.1.0","global":{"database":{"datatype":"mysql","host":"127.0.0.1","name":"opla_dev","user":"root","password":"","charset":"utf8mb4","version":"2"},"api":{"endpoint":"/api","version":"42","port":8081},"botSite":{"url":"/publish/"},"gateway":{"url":"https://gateway.opla.ai"}},"auth":{"database":{"parent":"global","name":"auth"},"api":{"endpoint":"/auth"}},"messenger":{"database":{"parent":"global","name":"messenger"}},"users":{"database":{"parent":"global","name":"users"}},"bots":{"database":{"parent":"global","name":"bots"}},"webhooks":{"database":{"parent":"global","name":"webhooks"}},"middlewares":{"database":{"parent":"global","name":"middlewares"}},"parameters":{"database":{"parent":"global","name":"parameters"}},"buildSchema":false}
  `);
  describe("constructor", () => {
    it("create App with user configuration", () => {
      const createDBSpy = jest.spyOn(App, "createDB");
      // const zoauthServerSpy = jest.spyOn(App, "zoauthServer");
      const configuration = { ...defaultTestConfiguration };

      expect(configuration.name).toBeDefined();
      expect(configuration.global).toBeDefined();
      expect(configuration.global.database).toBeDefined();
      expect(configuration.buildSchema).toBeDefined();

      expect(configuration.api).not.toBeDefined();
      expect(configuration.global.api).toBeDefined();

      // create App
      const app = new App(configuration, {});

      expect(app.buildSchema).toEqual(false);
      expect(configuration.buildSchema).toBeDefined();

      // create database
      expect(createDBSpy).toHaveBeenCalledWith(configuration);

      expect(configuration.auth).toBeDefined();

      // create zoauthServer
      /* expect(zoauthServerSpy).toHaveBeenCalledWith(
        configuration.auth,
        undefined,
      ); */

      expect(app.endpoint).toEqual("/api/v42");

      expect(app.buildSchema).toEqual(false);
    });

    it("create App without user configuration", () => {
      jest.clearAllMocks();
      const createDBSpy = jest.spyOn(App, "createDB");
      // const zoauthServerSpy = jest.spyOn(App, "zoauthServer");
      const createMainControllersSpy = jest.spyOn(App, "createMainControllers");

      const configuration = { ...defaultAppConfig };

      // create App
      const app = new App(configuration, {});

      expect(app.buildSchema).toEqual(true);
      expect(configuration.buildSchema).toBeDefined();

      // build database
      expect(createDBSpy).toHaveBeenCalledWith(defaultAppConfig);
      const defaultDB = {
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

      expect(createDBSpy.mock.results[0].value).toEqual(defaultDB);

      /* const defaultAuthConf = {
        api: { endpoint: "/auth" },
        database: {
          name: "auth",
          parent: defaultDB,
        },
      };
     //  expect(zoauthServerSpy).toHaveBeenCalledWith(defaultAuthConf, undefined); */

      expect(app.endpoint).toEqual("/api/v1");

      expect(configuration.name).toEqual("Zoapp backend");
      expect(configuration.global.api.version).toEqual("1");
      expect(configuration.users.database.name).toEqual("users");
      expect(configuration.middlewares.database.name).toEqual("middlewares");

      expect(createMainControllersSpy).toHaveBeenCalled();
      expect(createMainControllersSpy).toHaveBeenCalledWith(app, {
        ...configuration,
      });
    });
  });

  describe("throw ConfigurationError", () => {
    it("should throw error if database configuration is not define", () => {
      const configWithoutDatabase = {
        ...defaultTestConfiguration,
        global: { ...defaultTestConfiguration.global, database: undefined },
      };

      expect(() => {
        new App(configWithoutDatabase, {}); // eslint-disable-line no-new
      }).toThrowError("global database configuration not found");
    });

    it("should throw error if auth configuration is not define", () => {
      const configWithoutAuth = {
        ...defaultTestConfiguration,
        auth: undefined,
      };

      expect(() => {
        new App(configWithoutAuth, {}); // eslint-disable-line no-new
      }).toThrowError("auth configuration not found");
    });

    it("should throw error if api endpoint configuration is not define", () => {
      expect(() => {
        App.buildAPIEndpoint({});
      }).toThrowError("global api endpoint configuration not found");
    });

    it("should throw error if global database configuration is not define", () => {
      expect(() => {
        App.createDB({});
      }).toThrowError("lobal database configuration not found");
    });
  });
});
