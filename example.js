const config = require('./config');
const DevRPG = require('./src/devrpg');

const rpg = new DevRPG(config);

rpg.run('/', 3100, (commits) => {
  console.log(`Detected ${commits.length} new commit(s)`);
});
