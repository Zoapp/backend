const httpPort = 8081 || process.env.PORT;

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
    management_endpoint: false,
    public_url: `http://localhost:${httpPort}/`,
    api_url: `http://localhost:${httpPort}/api/v1/`,
    auth_url: `http://localhost:${httpPort}/auth/`,
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
  build_schema: true,
};

export default defaultAppConfig;
