class Project {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.namespace = config.namespace;
    this.url = config.url;
    this.path = config.path;
  }

  /**
   * @return int
   */
  getID() {
    return this.id;
  }

  /**
   * @return string
   */
  getName() {
    return this.name;
  }

  /**
   * @return string
   */
  getDescription() {
    return this.description;
  }

  /**
   * @return string
   */
  getNamespace() {
    return this.namespace;
  }

  /**
   * @return string
   */
  getURL() {
    return this.url;
  }

  /**
   * @return string
   */
  getPath() {
    return this.path;
  }
}

module.exports = Project;
