import { resolve, join } from 'node:path';

/** Resolve a user-supplied relative path safely under baseDir. */
export const safePathUnder = (baseDir: string, relativePath: string): string | null => {
  const cleaned = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (cleaned.includes('..') || cleaned.includes('\0')) {
    return null;
  }
  const absolute = resolve(join(baseDir, cleaned));
  const base = resolve(baseDir);
  if (!absolute.startsWith(base + '/') && absolute !== base) {
    return null;
  }
  return absolute;
};
