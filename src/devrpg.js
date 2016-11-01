const Firebase = require('./firebase');
const GitLab = require('./gitlab');
const User = require('./user');
const Project = require('./project');
const Commit = require('./commit');
const express = require('express');
const bodyParser = require('body-parser');

class DevRPG {
  constructor(config) {
    global.firebase = new Firebase(config.firebase);
    global.gitlab = new GitLab(config.gitlab);
  }

  /**
   * Run DevRPG
   * @param string path
   * @param int port
   * @param function callback
   */
  run(path, port, callback) {
    this.app = express();
    this.app.post(path, bodyParser.json(), (req, res) => {
      if (req.headers['x-gitlab-event']) {
        const data = req.body;
        this.process(data).then((processedData) => {
          res.send('Success');
          this.store(processedData).then((result) => {
            callback(result);
          });
        });
      }
    });
    this.app.listen(port, () => {
      console.log(`DevRPG now listening at ${path} on port ${port}`);
    });
  }

  /**
   * Process GitLab webhook
   * @param object data
   * @return Promise
   */
  process(data) {
    return new Promise((resolve, reject) => {
      const result = [];
      let checkedCommits = 0;

      // Only accept push events
      if (data.object_kind !== 'push') {
        reject('Incorrect object kind');
        return;
      }

      // Generate project
      const project = new Project({
        id: data.project_id,
        name: data.project.name,
        description: data.project.name,
        namespace: data.project.namespace,
        url: data.project.web_url,
        path: data.project.path_with_namespace,
      });

      data.commits.forEach((commitData) => {

        // Generate commit
        const commit = new Commit({
          id: commitData.id,
          message: commitData.message,
          date: new Date(commitData.timestamp),
          url: commitData.url,
          project,
        });

        // Check if commit data has any activity
        if (commitData.added.length > 0 || commitData.modified.length > 0 || commitData.removed.length > 0) {

          const user = new User({
            name: commitData.author.name,
            email: commitData.author.email,
          });

          if (!result[user.getName()]) {
            result[user.getName()] = user;
          }

          // Diff added files
          new Promise((resolve) => {
            let checkedFiles = 0;
            if (commitData.added.length > 0) {
              commitData.added.forEach((filename) => {
                global.gitlab.diffFile(commit, filename, 'addition').then((file) => {
                  commit.addFile(file);
                  commit.calculateEXP();
                  checkedFiles += 1;
                  if (checkedFiles === commitData.added.length) {
                    resolve(commit);
                  }
                }).catch((err) => {
                  console.log(err);
                  checkedFiles += 1;
                  if (checkedFiles === commitData.added.length) {
                    resolve(commit);
                  }
                });
              });
            } else {
              resolve(commit);
            }

          // Diff removed files
          }).then((commit) => {
            new Promise((resolve) => {
              let checkedFiles = 0;
              if (commitData.added.length > 0) {
                commitData.added.forEach((filename) => {
                  global.gitlab.diffFile(commit, filename, 'addition').then((file) => {
                    commit.addFile(file);
                    commit.calculateEXP();
                    checkedFiles += 1;
                    if (checkedFiles === commitData.removed.length) {
                      resolve(commit);
                    }
                  }).catch((err) => {
                    console.log(err);
                    checkedFiles += 1;
                    if (checkedFiles === commitData.removed.length) {
                      resolve(commit);
                    }
                  });
                });
              } else {
                resolve(commit);
              }

            // Diff modified files
            }).then((commit) => {
              new Promise((resolve) => {
                let checkedFiles = 0;
                if (commitData.modified.length > 0) {
                  commitData.modified.forEach((filename) => {
                    global.gitlab.diffFile(commit, filename, 'modified').then((file) => {
                      commit.addFile(file);
                      commit.calculateEXP();
                      checkedFiles += 1;
                      if (checkedFiles === commitData.modified.length) {
                        resolve(commit);
                      }
                    }).catch((err) => {
                      console.log(err);
                      checkedFiles += 1;
                      if (checkedFiles === commitData.modified.length) {
                        resolve(commit);
                      }
                    });
                  });
                } else {
                  resolve(commit);
                }

              // Append commit to result
              }).then((commit) => {
                result[user.getName()].addCommit(commit);
                checkedCommits += 1;
                if (checkedCommits === data.commits.length) {
                  resolve(result);
                }
              });
            });
          });

        // No activity submitted
        } else {
          console.log(`#${commit.getID()}: no activity on commit`);
          checkedCommits += 1;
          if (checkedCommits === data.commits.length) {
            resolve(result);
          }
        }
      });
    });
  }

  /**
   * Store data to database
   * @param array data
   * @return Promise
   */
  store(data) {
    return new Promise((resolve) => {
      let progress = 0;
      const result = [];

      // Load existing user from database
      for (const userKey of Object.keys(data)) {
        const newUser = data[userKey];
        const newCommits = newUser.getCommits();
        global.firebase.get(`users/${userKey}`).then((userResponse) => {
          let user = new User({ name: newUser.name, email: newUser.email, skills: newUser.skills, stats: newUser.stats });
          if (userResponse !== null) {
            user = new User(userResponse);
          }

          // Cycle through parsed commits
          for (const i of Object.keys(newCommits)) {

            // Determine if commit has already been stored
            const newCommit = newCommits[i];
            if (!user.hasCommit(newCommit)) {

              // Add if not found
              newCommit.clearFiles();
              user.addCommit(newCommit);
              for (const k of Object.keys(newCommit.getSkills())) {
                const skill = newCommit.getSkills()[k];
                user.addEXP(skill.name, skill.exp);
              }
              result.push(newCommit);
            }
          }

          // Store finalised data for user
          global.firebase.set(`users/${userKey}`, user).then(() => {
            progress += 1;
            if (progress === Object.keys(data).length) {
              resolve(result);
            }
          });

        });
      }
    });
  }
}

module.exports = DevRPG;
