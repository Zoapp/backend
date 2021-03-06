/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import AbstractController from "./abstractController";
import TunnelProvider from "../utils/tunnelProvider";
// import emailConstraints from "../constraints/EmailParameters";

export default class extends AbstractController {
  constructor(name, main, className) {
    super(name, main, className);
    this.model = null;
  }

  async open() {
    try {
      await super.open();
      const backend =
        (await this.getMainParameters().getValue("backend")) || {};
      // TODO remove tunnel init here and create a middleware dispatch for it
      if (backend.tunnel) {
        const tunnel = backend.tunnel.active;
        if (tunnel && tunnel.provider) {
          const cfg = this.main.config;
          const { port } = cfg.global.api;
          const params = {
            port,
            subdomain: tunnel.subdomain,
            host: tunnel.host,
            localhost: tunnel.localhost,
          };
          const url = await TunnelProvider.register(
            this.zoapp.controllers.getPluginsController(),
            tunnel.provider,
            params,
          );
          if (url !== tunnel.url) {
            logger.info("TunnelProvider url changed", url);
            backend.tunnel.active.url = url;
            backend.tunnel.active.subdomain = TunnelProvider.getActive(
              this.zoapp.controllers.getPluginsController(),
            ).subdomain;
            await this.getMainParameters().setValue("backend", backend);
          }
        }
      }
      // Init email service
      const emailService = this.getEmailService();
      const parameters = await this.getEmailParameters();
      if (emailService && parameters) {
        await emailService.open(parameters);
      }
    } catch (error) {
      logger.error(error);
    }
  }

  async setup() {
    this.set = true;
    // TODO
  }

  async getParameters(user, clientId, scope) {
    const isMaster = scope === "master";
    const isAdmin = isMaster || scope === "admin";
    const parameters = {};
    // WIP get backend settings
    parameters.backend = await this.getMainParameters().getValue("backend");
    if (!parameters.backend) {
      parameters.backend = {};
    }
    if (!parameters.backend.tunnel) {
      parameters.backend.tunnel = {};
    }
    // TODO remove tunnel stuff here and create a middleware dispatch for it
    parameters.backend.tunnel.providers = TunnelProvider.listAll(
      this.zoapp.controllers.getPluginsController(),
    );
    if (!parameters.backend.tunnel.active) {
      parameters.backend.tunnel.active = TunnelProvider.getActive(
        this.zoapp.controllers.getPluginsController(),
      );
    }

    // Get backend url params from config.
    const cfg = this.main.config;
    parameters.backend.publicUrl = cfg.global.public_url;
    parameters.backend.apiUrl = cfg.global.api_url;
    parameters.backend.authUrl = cfg.global.auth_url;
    parameters.backend.managementEndpoint = cfg.global.management_endpoint;

    if (!parameters.backend.publicUrl) {
      logger.info("tunnel.active=", parameters.backend.tunnel.active);
      if (parameters.backend.tunnel.active) {
        parameters.backend.publicUrl =
          parameters.backend.tunnel.active.url || "";
      } else {
        parameters.backend.publicUrl = "";
      }
    }

    if (!parameters.backend.apiUrl) {
      parameters.backend.apiUrl = [
        `${cfg.global.api.ip}:${cfg.global.api.port}`,
        cfg.global.api.endpoint,
        `/${cfg.global.api.version}/`,
      ].join("");
    }

    if (!parameters.backend.authUrl) {
      parameters.backend.authUrl = [
        `${cfg.global.api.ip}:${cfg.global.api.port}`,
        `${cfg.auth.api.endpoint}/`,
      ].join("");
    }

    if (!parameters.backend.clientId) {
      // TODO get ClientId
      parameters.backend.clientId = clientId;
    }

    if (!parameters.backend.clientSecret) {
      // TODO get ClientSecret
      const app = await this.main.getApplication(clientId);
      parameters.backend.clientSecret = app.secret;
    }

    if (!isAdmin) {
      delete parameters.backend.apiUrl;
      delete parameters.backend.authUrl;
      delete parameters.backend.clientId;
      delete parameters.backend.clientSecret;
      delete parameters.backend.tunnel;
    } else {
      // WIP get emailServer settings
      parameters.emailServer = await this.getEmailParameters();
      if (!parameters.emailServer) {
        parameters.emailServer = {};
      } else {
        delete parameters.emailServer.auth.pass;
      }
    }

    // Enable multiProjects from config
    const multiProjects = await this.main.isMultiProjects(user.id, scope);
    if (multiProjects) {
      parameters.multiProjects = true;
    }

    if (this.zoapp.extensions && this.zoapp.extensions.getAdminParameters) {
      return this.zoapp.extensions.getAdminParameters(
        user,
        isMaster,
        parameters,
      );
    }

    return { params: parameters };
  }

  async setParameters(user, clientId, parameters) {
    // TODO check errors
    if (parameters.tunnel) {
      let { tunnel } = parameters;
      if (tunnel !== "None") {
        const cfg = this.main.config;
        tunnel.port = cfg.global.api.port;
      }
      // TODO remove tunnel stuff here and create a middleware dispatch for it
      logger.info("tunnel=", tunnel);
      const backend =
        (await this.getMainParameters().getValue("backend")) || {};
      let prevTunnel = backend.tunnel;
      if (!prevTunnel) {
        prevTunnel =
          TunnelProvider.getActive(
            this.zoapp.controllers.getPluginsController(),
          ) || {};
      }
      if (prevTunnel.provider !== parameters.tunnel.provider) {
        if (prevTunnel.provider) {
          await TunnelProvider.unregister(
            this.zoapp.controllers.getPluginsController(),
            prevTunnel.provider,
          );
        }
        if (tunnel !== "None") {
          tunnel.url = await TunnelProvider.register(
            this.zoapp.controllers.getPluginsController(),
            tunnel.provider,
            tunnel,
          );
          logger.info("tunnel.url", tunnel.url);
          if (tunnel.url) {
            tunnel.subdomain = TunnelProvider.getActive(
              this.zoapp.controllers.getPluginsController(),
            ).subdomain;
          }
        } else {
          tunnel = null;
        }
        backend.tunnel = { active: { ...tunnel } };
        logger.info("backend.tunnel", backend.tunnel);
        await this.getMainParameters().setValue("backend", backend);
      }
    } else if (parameters.backend) {
      const prevBackend = await this.getMainParameters().getValue("backend");
      if (prevBackend.tunnel) {
        const p = parameters;
        p.backend.tunnel = prevBackend.tunnel;
      }
      await this.getMainParameters().setValue("backend", parameters.backend);
    } else if (parameters.emailServer) {
      await this.configureMail(parameters.emailServer);
    }
    return this.getParameters(user, clientId, "admin");
  }

  async configureMail(parameters) {
    let port = Number(parameters.port);
    if (Number.isNaN(port)) {
      port = null;
    }
    const smtpConfig = {
      host: parameters.host,
      port,
      secure: true,
      auth: {
        user: parameters.username,
        pass: parameters.password,
      },
      defaultParams: {
        from: parameters.from,
      },
    };

    try {
      await this.getEmailService().open(smtpConfig);
    } catch (error) {
      throw new Error(error.message);
    }

    return this.setEmailParameters(smtpConfig);
  }

  async getEmailParameters() {
    return this.getMainParameters().getValue("emailServer");
  }

  async setEmailParameters(parameters) {
    return this.getMainParameters().setValue("emailServer", parameters);
  }
}
