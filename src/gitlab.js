const gitlab = require('gitlab');
const parseDiff = require('parse-diff');
const File = require('./file');

class GitLab {
  constructor(config) {
    this.gitlab = gitlab({
      url: config.url,
      token: config.token,
    });
    this.timeout = 5000;
  }

  /**
   * Make a query to GitLab
   * @param function callback
   * @return Promise
   */
  query(callback) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject('GitLab query timed out');
      }, this.timeout);
      callback(resolve, reject);
    });
  }

  /**
   * Fetch commit data from GitLab
   * @param Commit commit
   * @return Promise
   */
  fetchCommit(commit) {
    return this.query((resolve, reject) => {
      if (commit.getMessage().match(/^Merge/) !== null) {
        reject(`Commit #${commit.getID()} was possibly a merge`);
      } else {
        this.gitlab.projects.repository.diffCommit(commit.getProject().getID(), commit.getID(), (diffs) => {
          if (diffs === null) {
            reject(`No diff data received for commit #${commit.getID()}`);

          // Cycle through diffs
          } else if (diffs.length > 0) {
            diffs.forEach((diff) => {
              const file = new File({
                name: diff.new_path,
                project: commit.getProject(),
              });

              // Don't add the file if it's ignored or has an untracked skill
              if (file.isIgnored() || !file.getSkill()) {
                resolve(commit);
              } else {

                // Count the number of additions per diff
                let additions = 0;
                parseDiff(diff.diff).forEach((parsedDiff) => {
                  parsedDiff.chunks.forEach((chunk) => {
                    chunk.changes.forEach((change) => {
                      const value = change.content.substring(1).replace(/\s/, '');
                      if (!(value.substring(1, 3) === '//' || value.substring(1) === '*' || value.substring(1, 3) === '/*')) {
                        switch (change.type) {
                          case 'add':
                            additions += 1;
                            break;
                          case 'del':
                            additions -= 1;
                            break;
                        }
                      }
                    });
                  });
                });
                file.setAdditions(additions);

                // Fetch file content
                this.fetchFileContent(commit, file).then((response) => {
                  commit.addFile(response);
                  commit.addAdditions(additions);
                  commit.calculateEXP();
                  resolve(commit);
                });
              }
            });
          }
        });
      }
    });
  }

  /**
   * Fetch file content
   * @param Commit commit
   * @param File file
   * @return Promise
   */
  fetchFileContent(commit, file) {
    return this.query((resolve) => {
      this.gitlab.projects.repository.showFile(commit.getProject().getID(), {
        file_path: file.getName(),
        ref: commit.getID(),
      }, (response) => {
        if (response) {
          file.setContent(response.content); // base64
        }
        resolve(file);
      });
    });
  }
}

module.exports = GitLab;
