import * as parseDiff from 'parse-diff';

const MIN_EXP = 10;
const MAX_EXP = 50;

/**
 * Calculate the number of experience points for a commit
 */
export const calculate = (diff: parseDiff.File): number => {
  if (diff.deleted) {
    return 0;
  }
  const additions = Math.max(diff.additions - diff.deletions, 0);
  return Math.max(
    Math.min((Math.floor(additions / 12) + 1) * 10, MAX_EXP),
    MIN_EXP,
  );
};
