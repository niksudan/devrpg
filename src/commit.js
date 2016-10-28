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

  clearFiles() {
    this.files = [];
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
    this.additions += additions;
  }

  /**
   * @return array
   */
  getSkills() {
    return this.skills;
  }

  /**
   * @return float
   */
  getBonusEXP() {
    this.bonusExp = Math.min(Math.floor(this.getFiles().length / 5) * 5, 20);
    return this.bonusExp;
  }

  /**
   * Calculate EXP for all files
   */
  calculateEXP() {
    this.skills = [];
    this.getFiles().forEach((file) => {

      // Parse file skills and store to commit
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
          this.skills[file.getSkillName()] = {
            name: file.getSkillName(),
            additions: Math.max(additions, 0),
            exp: 0,
          };
        }

        // Calculate EXP and apply bonus EXP if necessary
        for (const i of Object.keys(this.getSkills())) {
          const skill = this.getSkills()[i];
          skill.exp = Math.max(Math.min((Math.floor(skill.additions / 12) + 1) * 10, 50), 10) + this.getBonusEXP();
        }
      }
    });
  }
}

module.exports = Commit;
