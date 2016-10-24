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
          this.store(processedData).then((result) => {
            callback(result);
            res.send('Success');
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
      const cache = [];
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
        const newCommit = new Commit({
          id: commitData.id,
          message: commitData.message,
          date: new Date(commitData.timestamp),
          url: commitData.url,
          project,
        });

        // Get cached user
        new Promise((resolve) => {
          const user = new User({
            name: commitData.author.name,
            email: commitData.author.email,
          });
          if (!cache[user.getName()]) {
            result[user.getName()] = user;
            global.firebase.get(`users/${user.getName()}`).then((userResponse) => {
              if (userResponse !== null) {
                cache[user.getName()] = new User(userResponse);
              } else {
                cache[user.getName()] = user;
              }
              resolve(cache[user.getName()]);
            });
          } else {
            resolve(cache[user.getName()]);
          }
        }).then((user) => {

          // Check that commit does not already exist
          if (!user.hasCommit(newCommit)) {
            console.log(`#${newCommit.getID()}: commit is new`);

            // Fetch commit data and update result
            global.gitlab.fetchCommit(newCommit).then((commit) => {
              result[user.getName()].addCommit(commit);
              checkedCommits += 1;
              if (checkedCommits === data.commits.length) {
                resolve(result);
              }

            // Problem fetching commit data
            }).catch((err) => {
              console.log(err);
              checkedCommits += 1;
              if (checkedCommits === data.commits.length) {
                resolve(result);
              }
            });

          // Commit already exists
          } else {
            console.log(`#${newCommit.getID()}: commit already checked`);
            checkedCommits += 1;
            if (checkedCommits === data.commits.length) {
              resolve(result);
            }
          }
        });
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
          let user = new User({ name: newUser.name, email: newUser.email, skills: newUser.skills });
          if (userResponse !== null) {
            user = new User(userResponse);
          }

          // Cycle through parsed commits
          for (const i of Object.keys(newCommits)) {

            // Determine if commit has already been stored
            const newCommit = newCommits[i];
            if (!user.hasCommit(newCommit)) {

              // Add if not found
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

  /**
   * Debug function used to fetch commit data
   * @param string commitID
   * @param int projectID
   * @param string projectPath
   */
  testCommit(commitID, projectID, projectPath) {
    try {
      global.gitlab.fetchCommit(new Commit({
        id: commitID,
        project: new Project({
          id: projectID,
          path: projectPath,
        }),
      })).then((commit) => {
        console.log(commit.getSkills());
        process.exit(1);
      }).catch((err) => {
        console.log(err);
        process.exit(0);
      });
    } catch (err) {
      console.log(err.message);
      process.exit(0);
    }

  }
}

module.exports = DevRPG;
