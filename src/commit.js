class Commit {
  constructor(config) {
    this.id = config.id;
    this.message = config.message;
    this.date = config.date;
    this.url = config.url;
    this.project = config.project;
    this.skills = config.skills === undefined ? [] : config.skills;
    this.files = config.files === undefined ? [] : config.files;
    this.additions = 0;
    this.bonusExp = 0;
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
  getMessage() {
    return this.message;
  }

  /**
   * @return string
   */
  getDate() {
    return this.date;
  }

  /**
   * @return string
   */
  getURL() {
    return this.url;
  }

  /**
   * @return Project
   */
  getProject() {
    return this.project;
  }

  /**
   * @return string
   */
  getFiles() {
    return this.files;
  }

  /**
   * @param File file
   */
  addFile(file) {
    this.files.push(file);
    this.addAdditions(file.getAdditions());
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
  addAdditions(additions) {
    this.additions += Math.max(0, additions);
  }

  /**
   * @return array
   */
  getSkills() {
    return this.skills;
  }

  /**
   * Calculate EXP for all files
   */
  calculateEXP() {
    this.skills = [];

    // Calculate bonus EXP
    this.bonusExp = Math.min(Math.floor(this.getFiles().length / 5) * 5, 20);

    this.getFiles().forEach((file) => {

      // Push individual skills
      if (file.getSkill()) {
        const additions = file.getAdditions() * file.getSkillHandicap();
        let found = false;
        for (const i of Object.keys(this.getSkills())) {
          const skill = this.getSkills()[i];
          if (!found && skill.name === file.getSkillName()) {
            skill.additions += additions;
            found = true;
          }
        }
        if (!found) {
          this.skills[file.getSkillName()] = { name: file.getSkillName(), additions, exp: 0 };
        }

        // Calculate EXP and apply bonus EXP if necessary
        for (const i of Object.keys(this.getSkills())) {
          const skill = this.getSkills()[i];
          skill.exp = Math.max(Math.min((Math.floor(skill.additions / 12) + 1) * 10, 50), 10) + this.bonusExp;
        }
      }
    });
  }
}

module.exports = Commit;
