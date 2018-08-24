const defaultAppConfig = {
  name: "Zoapp backend",
  version: "0.1.0",
  global: {
    database: {
      datatype: "mysql",
      host: "127.0.0.1",
      name: "opla_dev",
      user: "root",
      password: "",
      charset: "utf8mb4",
      version: "2",
    },
    api: {
      endpoint: "/api",
      version: "1",
      port: 8081,
    },
  },
  auth: {
    database: {
      parent: "global",
      name: "auth",
    },
    api: {
      endpoint: "/auth",
    },
  },
  users: {
    database: {
      parent: "global",
      name: "users",
    },
  },
  webhooks: {
    database: {
      parent: "global",
      name: "webhooks",
    },
  },
  middlewares: {
    database: {
      parent: "global",
      name: "middlewares",
    },
  },
  parameters: {
    database: {
      parent: "global",
      name: "parameters",
    },
  },
  buildSchema: true,
};

export default defaultAppConfig;
