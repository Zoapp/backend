/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Abstract class representing a plugin
 */
class AbstractPlugin {
  constructor({ name, title, type, classes = [], icon, ...optionals }) {
    this.pluginProperties = {
      name,
      title,
      type,
      classes,
      icon,
      ...optionals,
    };
  }

  get properties() {
    return this.pluginProperties;
  }

  set properties(properties) {
    this.pluginProperties = properties;
  }

  get name() {
    return this.pluginProperties.name;
  }

  set name(name) {
    this.pluginProperties.name = name;
  }

  get title() {
    return this.pluginProperties.title;
  }

  set title(title) {
    this.pluginProperties.title = title;
  }

  get type() {
    return this.pluginProperties.type;
  }

  set type(type) {
    this.pluginProperties.type = type;
  }

  get classes() {
    return this.pluginProperties.classes;
  }

  set classes(classes) {
    this.pluginProperties.classes = classes;
  }

  get icon() {
    return this.pluginProperties.icon;
  }

  set icon(icon) {
    this.pluginProperties.icon = icon;
  }

  getMiddlewareDefaultProperties() {
    return this.middleware && this.middleware.defaultProperties
      ? this.middleware.defaultProperties
      : this.properties;
  }
}

export default AbstractPlugin;
