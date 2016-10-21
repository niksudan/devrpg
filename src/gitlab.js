const got = require('got');
const atob = require('atob');
const jsdiff = require('diff');
const Commit = require('./commit');
const File = require('./file');

class GitLab {
  constructor(config) {
    this.url = config.url;
    this.token = config.token;
  }

  /**
   * Make a query to GitLab
   * @param string path
   * @return Promise
   */
  query(path) {
    return new Promise((resolve, reject) => {
      const url = `${this.url}/api/v3/${path}`;
      got(url, { headers: { 'PRIVATE-TOKEN': this.token } })
        .then((response) => {
          resolve(JSON.parse(response.body));
        })
        .catch((err) => {
          reject(err.response.body);
        });
    });
  }

  /**
   * Fetch commit data from GitLab
   * @param Commit commit
   * @return Promise
   */
  fetchCommit(commit) {
    return new Promise((resolve) => {
      console.log(`#${commit.getID()}: loading...`);

      // Load detailed commit data
      this.query(`projects/${commit.getProject().getID()}/repository/commits/${commit.getID()}`)
        .then((commitData) => {

          // Check if data was returned
          if (!commitData) {
            console.log(`#${commit.getID()}: returned no data - skipping`);
            resolve(commit);
          }

          // Check if commit is a merge
          if (commitData.parent_ids.length > 1) {
            console.log(`#${commit.getID()}: merge - skipping`);
            resolve(commit);
          }

          // Fetch major files for commit
          this.fetchFiles(commit)
            .then((newFiles) => {
              console.log(`#${commit.getID()}: loaded`);

              // Check if project has any major files
              if (newFiles.length === 0) {
                console.log(`#${commit.getID()}: no major files - skipping`);
                resolve(commit);

              // Add total lines as additions if initial commit
              } else if (commitData.parent_ids.length === 0) {
                console.log(`#${commit.getID()}: initial commit - adding all lines as additions`);
                let checkedFiles = 0;
                newFiles.forEach((newFile) => {
                  newFile.setAdditions(newFile.getLines());
                  commit.addFile(newFile);
                  commit.calculateEXP();
                  checkedFiles += 1;
                  if (checkedFiles === newFiles.length) {
                    console.log(`#${commit.getID()}: finished`);
                    resolve(commit);
                  }
                });

              // Fetch major files for commit's parent
              } else {
                console.log(`#${commit.getID()}: parent #${commitData.parent_ids[0]} loading...`);
                this.fetchFiles(new Commit({
                  id: commitData.parent_ids[0],
                  project: commit.getProject(),
                }))
                  .then((oldFiles) => {
                    console.log(`#${commit.getID()}: parent #${commitData.parent_ids[0]} loaded`);

                    // Check if parent has any major files
                    if (oldFiles.length === 0) {
                      console.log(`#${commit.getID()}: no major files`);
                      let checkedFiles = 0;
                      newFiles.forEach((newFile) => {
                        newFile.setAdditions(newFile.getLines());
                        commit.addFile(newFile);
                        commit.calculateEXP();
                        checkedFiles += 1;
                        if (checkedFiles === newFiles.length) {
                          console.log(`#${commit.getID()}: finished`);
                          resolve(commit);
                        }
                      });

                    // Diff commits
                    } else {
                      newFiles.forEach((newFile) => {

                        // Find previous version of file
                        let prevFile = false;
                        oldFiles.forEach((oldFile) => {
                          if (oldFile.getName() === newFile.getName()) {
                            prevFile = oldFile;
                          }
                        });

                        // Check if file actually exists
                        if (prevFile === false) {
                          newFile.setAdditions(newFile.getLines());
                          commit.addFile(newFile);
                          commit.calculateEXP();

                        // Diff file content
                        } else {
                          try {
                            const diff = jsdiff.structuredPatch('', '', atob(prevFile.getContent()), atob(newFile.getContent()), '', '');
                            if (diff.hunks.length > 0) {
                              diff.hunks.forEach((hunk) => {
                                console.log(`#${commit.getID()}: ${newFile.getName()} was modified`);
                                newFile.setAdditions(hunk.newLines - hunk.oldLines);
                                commit.addFile(newFile);
                                commit.calculateEXP();
                              });
                            }
                          } catch (err) {
                            console.log(err.message);
                          }

                        }
                      });

                      console.log(`#${commit.getID()}: finished`);
                      resolve(commit);
                    }
                  });
              }
            });
        });
    });
  }

  fetchFiles(commit, path) {
    return new Promise((resolve) => {
      if (!path) {
        path = '';
      }
      let files = [];
      this.query(`projects/${commit.getProject().getID()}/repository/tree?ref_name=${commit.getID()}&path=${path}`)
        .then((tree) => {
          let checkedFiles = 0;
          tree.forEach((treeData) => {
            const file = new File({
              name: `${path}${treeData.name}`,
              project: commit.getProject(),
            });
            if (!file.isIgnored()) {
              switch (treeData.type) {
                case 'blob': {
                  if (file.getSkill()) {
                    this.fetchFileContent(commit, file)
                      .then((fileWithContent) => {
                        files.push(fileWithContent);
                        checkedFiles += 1;
                        if (checkedFiles === tree.length) {
                          resolve(files);
                        }
                      });
                  } else {
                    checkedFiles += 1;
                    if (checkedFiles === tree.length) {
                      resolve(files);
                    }
                  }
                  break;
                }
                case 'tree': {
                  const newPath = `${path}${treeData.name}/`;
                  this.fetchFiles(commit, newPath)
                    .then((newFiles) => {
                      files = files.concat(newFiles);
                      checkedFiles += 1;
                      if (checkedFiles === tree.length) {
                        resolve(files);
                      }
                    });
                  break;
                }
              }
            } else {
              checkedFiles += 1;
              if (checkedFiles === tree.length) {
                resolve(files);
              }
            }
          });
        });
    });
  }

  /**
   * Fetch file content
   * @param Commit commit
   * @param File file
   * @return Promise
   */
  fetchFileContent(commit, file) {
    return new Promise((resolve) => {
      this.query(`projects/${commit.getProject().getID()}/repository/files?file_path=${file.getName()}&ref=${commit.getID()}`)
        .then((response) => {
          if (response) {
            file.setContent(response.content);
          }
          resolve(file);
        });
    });
  }
}

module.exports = GitLab;
