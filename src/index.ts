import { getCommit, getDiff } from './lib/git';

(async () => {
  const commit = await getCommit();
  const diff = await getDiff();
})();
