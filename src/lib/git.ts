import * as execa from 'execa';
import * as parse from 'parse-diff';

/**
 * Get details of the last git commit
 */
export const getCommit = async () => {
  const { stdout } = await execa('git', [
    'log',
    '-1',
    '--pretty=format:{"hash": "%h", "author":{"name": "%aN", "email": "%aE"}, "date": "%ad", "message": "%s"}',
    '--date=iso',
  ]);
  return JSON.parse(stdout);
};

/**
 * Get details of the last git diff
 */
export const getDiff = async () => {
  const { stdout } = await execa('git', ['show']);
  return parse(stdout);
};
