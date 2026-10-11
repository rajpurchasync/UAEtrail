import { execSync } from 'node:child_process';

/** Indexed paths that still exist in the worktree (excludes unstaged deletions). */
export const listGitTrackedFiles = (pathspec: string): string[] => {
  const tracked = execSync(`git ls-files ${pathspec}`, { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
  const deletedRaw = execSync(`git ls-files --deleted ${pathspec}`, { encoding: 'utf8' }).trim();
  const deleted = new Set(deletedRaw ? deletedRaw.split('\n') : []);
  return tracked.filter((file) => !deleted.has(file));
};
