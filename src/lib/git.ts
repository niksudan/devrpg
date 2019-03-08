declare var Promise: any;

import * as execa from 'execa';
import * as parseDiff from 'parse-diff';

interface Commit {
  author: { name: string; email: string };
  date: string;
  message: string;
}

/**
 * Get details of the last git commit
 */
export const getCommit = async (): Promise<Commit> => {
  const { stdout } = await execa('git', [
    'log',
    '-1',
    '--pretty=format:{"hash": "%h", "author":{"name": "%aN", "email": "%aE"}, "date": "%ad", "message": "%s"}',
    '--date=iso',
  ]);
  return JSON.parse(stdout);
};

/**
 * Get file diffs from the last git commit
 */
export const getDiffs = async (): Promise<parseDiff.File[]> => {
  const { stdout } = await execa('git', ['show']);
  return parseDiff(stdout);
};
