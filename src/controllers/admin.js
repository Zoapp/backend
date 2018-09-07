/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { createTransport } from "nodemailer";
import validate from "validate.js";
import AbstractController from "./abstractController";
import TunnelProvider from "../utils/tunnelProvider";
import emailConstraints from "../constraints/EmailParameters";

export default class extends AbstractController {
  constructor(name, main, className) {
    super(name, main, className);
    this.model = null;
  }

  async open() {
    await super.open();
    const backend = (await this.main.getParameters().getValue("backend")) || {};
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
          this.zoapp.pluginsManager,
          tunnel.provider,
          params,
        );
        if (url !== tunnel.url) {
          logger.info("TunnelProvider url changed", url);
          backend.tunnel.active.url = url;
          backend.tunnel.active.subdomain = TunnelProvider.getActive(
            this.zoapp.pluginsManager,
          ).subdomain;
          await this.main.getParameters().setValue("backend", backend);
        }
      }
    }
  }

  async setup() {
    this.set = true;
    // TODO
  }

  async getParameters(me, clientId, isAdmin = false, isMaster = false) {
    const parameters = {};
    // await this.main.getParameters().getInnerTable().create();
    // WIP get backend settings
    parameters.backend = await this.main.getParameters().getValue("backend");
    if (!parameters.backend) {
      parameters.backend = {};
    }
    if (!parameters.backend.tunnel) {
      parameters.backend.tunnel = {};
    }
    // TODO remove tunnel stuff here and create a middleware dispatch for it
    parameters.backend.tunnel.providers = TunnelProvider.listAll(
      this.zoapp.pluginsManager,
    );
    if (!parameters.backend.tunnel.active) {
      parameters.backend.tunnel.active = TunnelProvider.getActive(
        this.zoapp.pluginsManager,
      );
    }

    // Override with env variables.
    parameters.backend.publicUrl =
      process.env.ZOAPP_PUBLIC_URL || parameters.backend.publicUrl;
    parameters.backend.apiUrl =
      process.env.ZOAPP_API_URL || parameters.backend.apiUrl;
    parameters.backend.authUrl =
      process.env.ZOAPP_AUTH_URL || parameters.backend.authUrl;

    if (!parameters.backend.publicUrl) {
      logger.info("tunnel.active=", parameters.backend.tunnel.active);
      if (parameters.backend.tunnel.active) {
        parameters.backend.publicUrl =
          parameters.backend.tunnel.active.url || "";
      } else {
        parameters.backend.publicUrl = "";
      }
    }

    const cfg = this.main.config;
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

    // WIP get emailServer settings
    parameters.emailServer = await this.main
      .getParameters()
      .getValue("emailServer");

    if (!parameters.emailServer) {
      parameters.emailServer = {};
    }

    if (!isAdmin) {
      delete parameters.emailServer;
      delete parameters.backend.apiUrl;
      delete parameters.backend.authUrl;
      delete parameters.backend.clientId;
      delete parameters.backend.clientSecret;
      delete parameters.backend.tunnel;
    }

    if (this.zoapp.extensions && this.zoapp.extensions.getAdminParameters) {
      return this.zoapp.extensions.getAdminParameters(me, isMaster, parameters);
    }

    return { params: parameters };
  }

  async setParameters(me, clientId, parameters) {
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
        (await this.main.getParameters().getValue("backend")) || {};
      let prevTunnel = backend.tunnel;
      if (!prevTunnel) {
        prevTunnel = TunnelProvider.getActive(this.zoapp.pluginsManager) || {};
      }
      if (prevTunnel.provider !== parameters.tunnel.provider) {
        if (prevTunnel.provider) {
          await TunnelProvider.unregister(
            this.zoapp.pluginsManager,
            prevTunnel.provider,
          );
        }
        if (tunnel !== "None") {
          tunnel.url = await TunnelProvider.register(
            this.zoapp.pluginsManager,
            tunnel.provider,
            tunnel,
          );
          logger.info("tunnel.url", tunnel.url);
          if (tunnel.url) {
            tunnel.subdomain = TunnelProvider.getActive(
              this.zoapp.pluginsManager,
            ).subdomain;
          }
        } else {
          tunnel = null;
        }
        backend.tunnel = { active: { ...tunnel } };
        logger.info("backend.tunnel", backend.tunnel);
        await this.main.getParameters().setValue("backend", backend);
      }
    } else if (parameters.backend) {
      const prevBackend = await this.main.getParameters().getValue("backend");
      if (prevBackend.tunnel) {
        const p = parameters;
        p.backend.tunnel = prevBackend.tunnel;
      }
      await this.main.getParameters().setValue("backend", parameters.backend);
    } else if (parameters.emailServer) {
      await this.configureMail(parameters.emailServer);
    }
    return this.getParameters(me, clientId, true);
  }

  async configureMail(parameters) {
    try {
      await validate.async(parameters, emailConstraints);
    } catch (error) {
      throw new Error(error);
    }

    const smtpConfig = {
      host: parameters.host,
      port: parameters.port,
      secure: true,
      auth: {
        user: parameters.username,
        pass: parameters.password,
      },
    };

    const transporter = createTransport(smtpConfig);
    try {
      await transporter.verify();
    } catch (error) {
      throw new Error("impossible to configure SMTP");
    }

    this.main.getParameters().setValue("emailServer", parameters);
  }
}
