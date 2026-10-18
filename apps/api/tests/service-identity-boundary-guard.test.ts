import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const API_SRC = join(process.cwd(), 'src');

const LEFTOVER_LIB_FILES = [
  'auth-users.ts',
  'auth-tokens.ts',
  'chat-data.ts',
  'social-data.ts',
] as const;

const IDENTITY_STORES = [
  'auth-users-store.ts',
  'auth-tokens-store.ts',
  'chat-messages-store.ts',
  'social-reviews-store.ts',
] as const;

/** Leftover module specifiers — not `*-store` successors. */
const LEFTOVER_IMPORT =
  /from\s+['"][^'"]*\/(?:auth-users|auth-tokens|chat-data|social-data)(?:\.js)?['"]/;

const walkTsFiles = (dir: string, acc: string[] = []): string[] => {
  for (const ent of readdirSync(dir)) {
    const p = join(dir, ent);
    if (statSync(p).isDirectory()) {
      walkTsFiles(p, acc);
    } else if (ent.endsWith('.ts')) {
      acc.push(p);
    }
  }
  return acc;
};

/**
 * P4b — data access for identity / chat / reviews lives in *-store libs.
 * @see docs/SYSTEM_COHERENCE.md §8.6 MIG-SERVICE-IDENTITY-BOUNDARY
 */
describe('service identity boundary (MIG-SERVICE-IDENTITY-BOUNDARY)', () => {
  it('leftover data-lib filenames are gone (moved to *-store, no re-export shim)', () => {
    const present = LEFTOVER_LIB_FILES.filter((name) => existsSync(join(API_SRC, 'lib', name)));
    expect(present).toEqual([]);
  });

  it('identity / chat / review stores exist under *-store names', () => {
    for (const name of IDENTITY_STORES) {
      expect(existsSync(join(API_SRC, 'lib', name)), name).toBe(true);
    }
  });

  it('src does not import leftover auth-users | auth-tokens | chat-data | social-data modules', () => {
    const violations: string[] = [];
    for (const file of walkTsFiles(API_SRC)) {
      const text = readFileSync(file, 'utf8');
      if (LEFTOVER_IMPORT.test(text)) {
        violations.push(relative(API_SRC, file).replace(/\\/g, '/'));
      }
    }
    expect(violations).toEqual([]);
  });
});
