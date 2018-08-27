/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { setupLogger } from "zoapp-core";
import chai from "chai";
import chaiHttp from "chai-http";
import ApiServer from "../src/server";
import AppFunc from "../src/app";

import defaultAppConfig from "../src/defaultAppConfig";

const { expect } = chai;

chai.use(chaiHttp);

setupLogger("test");

const mysqlConfig = {
  // Global Database
  ...defaultAppConfig,
  global: {
    database: {
      datatype: "mysql",
      host: "localhost",
      name: "zoapp_test",
      user: "root",
      charset: "utf8mb4",
      version: "2",
    },
    api: {
      endpoint: "/api",
      version: "1",
      port: 8085,
    },
  },
};

const memDBConfig = {
  ...defaultAppConfig,
  global: {
    database: {
      datatype: "memDatabase",
    },
    api: {
      endpoint: "/api",
      version: "1",
      port: 8085,
    },
  },
};

// init : create app / users / auth / token
const initService = async (ctx, params, commons) => {
  const context = ctx;
  let config = {};
  if (params.config) {
    ({ config } = params);
  } else if (commons.config) {
    ({ config } = commons);
  }
  // logger.info("config=", config);
  const apiServer = ApiServer(config);
  const app = AppFunc(config, apiServer);
  await app.database.reset();
  await app.start();
  context.app = app;

  logger.info("initService with", params.title);
  context.title = params.title;
  const password = params.password ? params.password : commons.password;
  let r = await app.authServer.registerApplication({
    name: "Zoapp",
    grant_type: "password",
    redirect_uri: "localhost",
    email: "toto@test.com",
  });
  context.application = r.result;
  r = await app.authServer.registerUser({
    client_id: context.application.client_id,
    username: "user1",
    password: "12345",
    email: "user1@test.com",
  });
  context.user1 = r.result;
  r = await app.authServer.authorizeAccess({
    client_id: context.application.client_id,
    username: context.user1.username,
    password,
    redirect_uri: "localhost",
    scope: "admin",
  });
  r = await app.authServer.requestAccessToken({
    client_id: context.application.client_id,
    username: context.user1.username,
    password,
    redirect_uri: "localhost",
    grant_type: "password",
  });
  context.authUser1 = r.result;

  context.endpoint = app.endpoint;
  context.server = apiServer.server;
  // logger.info(`app=${JSON.stringify(context.application)}`);
  // logger.info(`user1=${JSON.stringify(context.user1)}`);
  // logger.info(`authUser1=${JSON.stringify(context.authUser1)}`);
  return context;
};

const buildUrl = (ctx, route, token = null) => {
  // logger.info("context=", context);
  let url = ctx.endpoint + route;
  if (token) {
    url += `?access_token=${token}`;
  }
  return url;
};

const result = (res, callback = null) => {
  expect(res).to.have.header("content-type", /json/);
  expect(res).to.have.status(200);
  /* eslint-disable no-unused-expressions */
  expect(res).to.be.json;
  /* eslint-enable no-unused-expressions */
  // logger.info(`res=${JSON.stringify(res.body)}`);
  if (callback) {
    callback(res.body);
    return null;
  }
  return res.body;
};

const getAsync = async (context, route, token = null) => {
  const res = await chai
    .request(context.server)
    .get(buildUrl(context, route, token))
    .set("Accept", "application/json");
  return result(res);
};

/*
const postAsync = async (context, route, token, body) => {
  const cid = context.application.client_id || "";
  const res = await chai
    .request(context.server)
    .post(buildUrl(context, route, token))
    .set("Accept", "application/json")
    .set("client_id", cid)
    .send(body);
  return result(res);
};

const putAsync = async (context, route, token, body) => {
  const res = await chai
    .request(context.server)
    .put(buildUrl(context, route, token))
    .set("Accept", "application/json")
    .send(body);
  return result(res);
};

const deleteAsync = async (context, route, token) => {
  const res = await chai
    .request(context.server)
    .delete(buildUrl(context, route, token))
    .set("Accept", "application/json");
  return result(res);
};
*/

let context = null;
const commonDatasets = { password: "12345" };

[
  { title: "MemDataset", config: memDBConfig },
  { title: "MySQLDataset", config: mysqlConfig },
].forEach((param) => {
  describe(`API using ${param.title}`, () => {
    beforeAll(async () => {
      context = await initService({}, param, commonDatasets);
    });

    afterAll(async () => {
      await context.app.database.delete();
      await context.app.close();
    });
    describe("/", () => {
      it("should return send infos on / GET", async () => {
        const res = await getAsync(context, "/");
        expect(res).to.have.all.keys(["version", "name"]);
      });
      it("should ping on /ping GET", async () => {
        const res = await getAsync(context, "/ping");
        expect(res).to.have.all.keys(["ping"]);
        // logger.info("context=", JSON.stringify(context));
      });
    });

    describe("/users", () => {
      it("should get currentUser on /me GET", async () => {
        context.userProfile1 = await getAsync(
          context,
          "/me",
          context.authUser1.access_token,
        );
        // WIP
        expect(context.userProfile1).to.have.all.keys([
          "id",
          "username",
          "avatar",
          "email",
        ]);
      });
      // it("should list users on /users GET"); // TODO
      it("should get a SINGLE user on /users/:id GET", async () => {
        const res = await getAsync(
          context,
          `/users/${context.userProfile1.id}`,
          context.authUser1.access_token,
        );
        // WIP
        expect(res).to.have.all.keys(["id", "username", "avatar", "email"]);
      });
      // it("should create a SINGLE user on /users POST"); // TODO
      // it("should update a SINGLE user on /users/<id> PUT"); // TODO
      // it("should delete a SINGLE user on /users/<id> DELETE"); // TODO
    });

    describe("/admin", () => {
      // it("should get admin infos /admin GET");
    });

    // TODO middlewares
    /* describe("/webhooks", () => {
    it("should register webhook /webhooks POST", async () => {
      context.webhook = await postAsync(
          context,
          "/webhooks",
          context.authUser1.access_token,
          { path: "/zoapp", url: "http://127.0.0.1:8889", name: "Zoapp", secret: "secret", actions: "" },
          );
      // WIP
      expect(context.webhook).to.have.all.keys([
        "id",
        "path",
        "name",
        "secret",
        "actions",
        "url",
      ]);
    });
    it("should unregister webhook /webhooks DELETE", async () => {
      const res = await deleteAsync(
          context,
          `/webhooks/${context.webhook.id}`,
          context.authUser1.access_token);
      // WIP
      expect(res).to.have.all.keys(["result"]);
    });
    it("should test webhook /webhooks/:id/test/:action POST");
  }); */
  });
});
