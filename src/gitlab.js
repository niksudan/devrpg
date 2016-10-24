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

      // Load detailed commit data
      this.query(`projects/${commit.getProject().getID()}/repository/commits/${commit.getID()}`)
        .then((commitData) => {

          // Check if data was returned
          if (!commitData) {
            console.log(`#${commit.getID()}: returned no data`);
            resolve(commit);
          }

          // Check if commit is a merge
          if (commitData.parent_ids.length > 1) {
            console.log(`#${commit.getID()}: commit was a merge`);
            resolve(commit);

          // Fetch major files for commit
          } else {
            this.fetchFiles(commit).then((newFiles) => {

              // Check if project has any trackable files
              if (newFiles.length === 0) {
                console.log(`#${commit.getID()}: commit has no trackable files`);
                resolve(commit);

              // Add total lines as additions if initial commit
              } else if (commitData.parent_ids.length === 0) {
                console.log(`#${commit.getID()}: commit was an initial commit`);
                let checkedFiles = 0;
                newFiles.forEach((newFile) => {
                  this.fetchFileContent(commit, newFile).then((newFile) => {
                    newFile.setAdditions(newFile.getLines());
                    commit.addFile(newFile);
                    commit.calculateEXP();
                    checkedFiles += 1;
                    console.log(`#${commit.getID()}: calculated file skills (${checkedFiles}/${newFiles.length})`);
                    if (checkedFiles === newFiles.length) {
                      console.log(`#${commit.getID()}: finished`);
                      resolve(commit);
                    }
                  });
                });

              // Fetch major files for commit's parent
              } else {
                console.log(`#${commit.getID()}: loaded commit data (1/2)`);
                const prevCommit = new Commit({
                  id: commitData.parent_ids[0],
                  project: commit.getProject(),
                });
                this.fetchFiles(prevCommit).then((oldFiles) => {
                  console.log(`#${commit.getID()}: loaded commit data (2/2)`);

                  // Check if parent has any major files
                  if (oldFiles.length === 0) {
                    console.log(`#${commit.getID()}: parent has no trackable files`);
                    let checkedFiles = 0;
                    newFiles.forEach((newFile) => {
                      this.fetchFileContent(commit, newFile).then((newFile) => {
                        newFile.setAdditions(newFile.getLines());
                        commit.addFile(newFile);
                        commit.calculateEXP();
                        checkedFiles += 1;
                        console.log(`#${commit.getID()}: calculated file skills (${checkedFiles}/${newFiles.length})`);
                        if (checkedFiles === newFiles.length) {
                          console.log(`#${commit.getID()}: finished`);
                          resolve(commit);
                        }
                      });
                    });

                  // Diff commits
                  } else {
                    console.log(`#${commit.getID()}: diffed files (0/${newFiles.length})`);
                    let checkedFiles = 0;
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
                        this.fetchFileContent(commit, newFile).then((newFile) => {
                          newFile.setAdditions(newFile.getLines());
                          commit.addFile(newFile);
                          commit.calculateEXP();
                          checkedFiles += 1;
                          console.log(`#${commit.getID()}: diffed files (${checkedFiles}/${newFiles.length})`);
                          if (checkedFiles === newFiles.length) {
                            console.log(`#${commit.getID()}: finished`);
                            resolve(commit);
                          }
                        });

                      // Diff file content
                      } else {
                        try {
                          this.fetchFileContent(commit, newFile).then((newFile) => {
                            this.fetchFileContent(prevCommit, prevFile).then((prevFile) => {
                              const diff = jsdiff.structuredPatch(prevFile.getName(), newFile.getName(), atob(prevFile.getContent()), atob(newFile.getContent()), '', '');
                              if (diff.hunks.length > 0) {
                                let checkedDiffs = 0;
                                diff.hunks.forEach((hunk) => {
                                  checkedDiffs += 1;
                                  console.log(`#${commit.getID()}: diff ${checkedDiffs} of ${diff.hunks.length} on ${newFile.getName()}`);
                                  newFile.addAdditions(hunk.newLines - hunk.oldLines);
                                  if (checkedDiffs === diff.hunks.length) {
                                    checkedFiles += 1;
                                    console.log(`#${commit.getID()}: diffed files (${checkedFiles}/${newFiles.length})`);
                                    commit.addFile(newFile);
                                    commit.calculateEXP();
                                    if (checkedFiles === newFiles.length) {
                                      console.log(`#${commit.getID()}: finished`);
                                      resolve(commit);
                                    }
                                  }
                                });
                              } else {
                                checkedFiles += 1;
                                console.log(`#${commit.getID()}: diffed files (${checkedFiles}/${newFiles.length})`);
                                if (checkedFiles === newFiles.length) {
                                  console.log(`#${commit.getID()}: finished`);
                                  resolve(commit);
                                }
                              }
                            });
                          });
                        } catch (err) {
                          console.log(err.message);
                        }

                      }
                    });
                  }
                }).catch((err) => {
                  console.log(err.message);
                });
              }
            });
          }
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
                    files.push(file);
                    checkedFiles += 1;
                    if (checkedFiles === tree.length) {
                      resolve(files);
                    }
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
        })
        .catch((err) => {
          console.log(`#${commit.getID()}: error loading content for file ${file.getName()} - ${err.message}`);
          resolve(file);
        });
    });
  }
}

module.exports = GitLab;
