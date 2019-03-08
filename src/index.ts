declare var console: any;

import chalk from 'chalk';
import 'core-js';

import { getCommit, getDiffs } from './lib/git';
import { getLanguage } from './lib/linguist';

(async () => {
  const commit = await getCommit();
  const diffs = await getDiffs();

  console.log(`${chalk.bold(commit.author.name)} committed the following:`);

  diffs.forEach(async (diff) => {
    if (!diff.deleted && diff.to) {
      const language = await getLanguage(diff.to);
      if (language) {
        console.log(`  ${chalk.green(diff.to)}`);
        console.log(`    Language:\t${chalk.yellow(language.name)}`);
        console.log(`    Category:\t${chalk.yellow(language.type)}`);
        console.log(`    Additions:\t${chalk.green(String(diff.additions))}`);
        console.log(`    Deletions:\t${chalk.red(String(diff.deletions))}`);
      }
    }
  });
})();
