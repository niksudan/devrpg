const config = require('./config');
const DevRPG = require('./src/devrpg');
const User = require('./src/user');
const Commit = require('./src/commit');

const rpg = new DevRPG(config);
const users = [];

/**
 * Add commit to user data
 * @param User user
 * @param Commit commit
 */
const addCommit = (user, commit) => {
  if (!users[user.name]) {
    users[user.name] = user;
  }
  users[user.name].addCommit(commit);
};

/**
 * Handle final output
 */
const handle = () => {
  console.log('Successfully parsed data');
  rpg.store(users).then((response) => {
    console.log(`Successfully stored ${response.length} commits`);
    process.exit(1);
  });
};

try {
  if (process.argv[2] === undefined) {
    throw 'No project defined, please specify an ID or a path with namespace';
  }

  console.log(`Restoring commits for ${process.argv[2]} this month...`);

  // Fetch project info
  global.gitlab.getProject(process.argv[2]).then((project) => {

    // Fetch project commits
    global.gitlab.query(`projects/${project.getID()}/repository/commits`).then((commits) => {
      let checkedCommits = 0;
      commits.forEach((commitData) => {

        // Prepare commit data
        const commit = new Commit({
          id: commitData.id,
          message: commitData.message,
          date: new Date(commitData.created_at),
          url: '',
          project,
        });

        // Prepare user data
        const user = new User({
          name: commitData.author_name,
          email: commitData.author_email,
        });

        // Check if commit was made this month
        if (new Date().getMonth() === new Date(commitData.created_at).getMonth()) {

          // Fetch commit diff for new file names
          global.gitlab.query(`projects/${project.getID()}/repository/commits/${commit.getID()}/diff`).then((diffs) => {
            let checkedFiles = 0;

            // Determine mode
            diffs.forEach((diff) => {
              let status = 'modified';
              if (diff.new_file) {
                status = 'addition';
              } else if (diff.deleted_file) {
                status = 'removal';
              }

              // Process file
              global.gitlab.diffFile(commit, diff.new_path, status).then((file) => {
                commit.addFile(file);
                commit.calculateEXP();
                checkedFiles += 1;
                if (checkedFiles === diffs.length) {
                  checkedCommits += 1;
                  addCommit(user, commit);
                  if (checkedCommits === commits.length) {
                    handle();
                  }
                }

              // Skip file
              }).catch((err) => {
                checkedFiles += 1;
                if (checkedFiles === diffs.length) {
                  checkedCommits += 1;
                  addCommit(user, commit);
                  if (checkedCommits === commits.length) {
                    handle();
                  }
                }
              });
            });
          });

        // Skip commit
        } else {
          checkedCommits += 1;
          if (checkedCommits === commits.length) {
            handle();
          }
        }
      });
    });
  });

// Fail
} catch (e) {
  console.log(e);
  process.exit(0);
}
