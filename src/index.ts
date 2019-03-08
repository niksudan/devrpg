import { getCommit, getDiffs } from './lib/git';
import { getLanguage } from './lib/linguist';

(async () => {
  const commit = await getCommit();
  const diffs = await getDiffs();

  console.log(`${commit.author.name} just committed the following files:`);

  diffs.forEach(async (diff) => {
    if (!diff.deleted) {
      const language = await getLanguage(diff.to);
      if (language !== null) {
        console.log(`  ${diff.to}`);
        console.log(`    Language: ${language.name}`);
        console.log(`    Category: ${language.type}`);
        console.log(`    Additions: ${diff.additions}`);
        console.log(`    Deletions: ${diff.deletions}`);
      }
    }
  });
})();
