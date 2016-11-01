class Project {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.namespace = config.namespace;
    this.url = config.url;
    this.path = config.path;
    this.tags = config.tags === undefined ? [] : config.tags;
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

  /**
   * @return array
   */
  getTags() {
    return this.tags;
  }

  /**
   * @param array tags
   */
  setTags(tags) {
    this.tags = tags;
  }

  /**
   * @param string tag
   * @return boolean
   */
  hasTag(tag) {
    return this.getTags().indexOf(tag) !== -1;
  }
}

module.exports = Project;
