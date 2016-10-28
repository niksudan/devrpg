const skills = require('../data/skills');
const ignores = require('../data/ignores');
const atob = require('atob');

class File {
  constructor(config) {
    this.name = config.name;
    this.project = config.project;
    this.additions = 0;
    this.skill = false;
    this.ignored = false;
    this.content = false;
    this.lines = 0;
    skills.forEach((skill) => {
      skill.includes.forEach((include) => {
        if (!this.skill && this.name.match(include) !== null) {
          this.skill = skill;
        }
      });
    });
    ignores.forEach((ignore) => {
      if (this.getName().indexOf(ignore) !== -1) {
        this.ignored = true;
      }
    });
  }

  /**
   * @return string
   */
  getName() {
    return this.name;
  }

  /**
   * @return object/false
   */
  getSkill() {
    return this.skill;
  }

  /**
   * @return string
   */
  getSkillName() {
    if (this.getSkill()) {
      return this.getSkill().name;
    }
    return null;
  }

  /**
   * @return int
   */
  getSkillHandicap() {
    if (this.getSkill()) {
      return Math.max(1, this.getSkill().handicap);
    }
    return 1;
  }

  /**
   * @return int
   */
  getAdditions() {
    return this.additions;
  }

  /**
   * @param int additions
   */
  setAdditions(additions) {
    this.additions = additions;
  }

  /**
   * @param int additions
   */
  addAdditions(additions) {
    this.additions += additions;
  }

  /**
   * @return boolean
   */
  isIgnored() {
    return this.ignored;
  }

  /**
   * @return string/false
   */
  getContent() {
    return this.content;
  }

  /**
   * @param string content
   */
  setContent(content) {
    this.content = content;
    this.lines = (atob(content).match(/\n/g) || []).length;
  }

  /**
   * @return int
   */
  getLines() {
    return this.lines;
  }
}

module.exports = File;
