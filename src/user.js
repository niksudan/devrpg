const expBase = 100;
const expModifier = 1.5;

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
        name: skillName,
        level: 1,
        totalExp: amount,
        currentExp: 0,
        neededExp: expBase,
      };
    } else {
      this.getSkills()[skillName].totalExp += amount;
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
    let exp = this.getSkills()[skillName].totalExp;
    let amount = expBase;
    let level = 1;
    while (exp > 0) {
      this.getSkills()[skillName].currentExp = exp;
      this.getSkills()[skillName].neededExp = amount;
      exp -= amount;
      if (exp > 0) {
        level += 1;
        amount *= Math.ceil(expModifier);
      }
    }
    this.getSkills()[skillName].level = level;
  }
}

module.exports = User;
