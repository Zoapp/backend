/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
let provider = null;

const TunnelProvider = {
  listAll(pluginsManager) {
    return pluginsManager.getPluginsNameList("TunnelProvider");
  },

  async register(pluginsManager, providerName, params) {
    // TODO
    logger.info("tunnelProvider.register", providerName);
    provider = { ...params };
    /* const plugin = pluginsManager.get(providerName);
    let url = null;
    if (plugin) {
      try {
        provider.url = await plugin.register(params);
        if (provider.url) {
          const a = provider.url.indexOf("//")+2;
          const b = provider.url.indexOf(".");
          provider.subdomain = provider.url.substring(a, b);
          logger.info("subdomain=", provider.subdomain);
        }
      } catch (e) {
        logger.info("TunnelProvider.register Error=", e);
      }
    } */
    return provider.url;
  },

  async unregister(pluginsManager, providerName) {
    // TODO
    logger.info("tunnelProvider.unregister", providerName);
    if (provider.provider === providerName) {
      provider = null;
      const plugin = pluginsManager.get(providerName);
      if (plugin) {
        try {
          await plugin.unregister();
        } catch (e) {
          logger.info("TunnelProvider.unregister Error=", e);
        }
      }
    }
  },

  getActive() {
    // WIP
    // logger.info("TunnelProvider.getActive ", pluginManager);
    return provider;
  },
};

export default TunnelProvider;
