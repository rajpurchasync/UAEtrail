import { resolve, join } from 'node:path';

const normalizeForCompare = (p: string) => resolve(p).replace(/\\/g, '/');

/** Resolve a user-supplied relative path safely under baseDir. */
export const safePathUnder = (baseDir: string, relativePath: string): string | null => {
  const cleaned = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (cleaned.includes('..') || cleaned.includes('\0')) {
    return null;
  }
  const absolute = resolve(join(baseDir, cleaned));
  const base = normalizeForCompare(baseDir);
  const normalizedAbsolute = normalizeForCompare(absolute);
  if (!normalizedAbsolute.startsWith(`${base}/`) && normalizedAbsolute !== base) {
    return null;
  }
  return absolute;
};
