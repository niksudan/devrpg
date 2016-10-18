class User {
  constructor(config) {
    this.name = config.name;
    this.email = config.email;
    this.skills = config.skills === undefined ? [] : config.skills;
    this.commits = config.commits === undefined ? [] : config.commits;
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
  getEmail() {
    return this.email;
  }

  /**
   * @return array
   */
  getSkills() {
    return this.skills;
  }

  /**
   * @param string skillName
   * @param int amount
   */
  addEXP(skillName, amount) {
    if (this.getSkills()[skillName] === undefined) {
      this.getSkills()[skillName] = {
        exp: amount,
        level: 0,
      };
    } else {
      this.getSkills()[skillName].exp += amount;
    }
    this.calculateLevel(skillName);
  }

  /**
   * @return array
   */
  getCommits() {
    return this.commits;
  }

  /**
   * @param Commit commit
   */
  addCommit(commit) {
    this.commits[commit.getID()] = commit;
  }

  /**
   * @param string skillName
   */
  calculateLevel(skillName) {
    let exp = this.getSkills()[skillName].exp;
    let amount = 100;
    let level = 1;
    while (exp > 0) {
      exp -= amount;
      if (exp > 0) {
        level += 1;
        amount *= 1.5;
      }
    }
    this.getSkills()[skillName].level = level;
  }
}

module.exports = User;
