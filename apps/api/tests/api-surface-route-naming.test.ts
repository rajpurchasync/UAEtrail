import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const API_ROUTES = join(process.cwd(), 'src', 'routes');

const collectTsFiles = (dir: string): string[] => {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectTsFiles(full));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      out.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return out;
};

/** Tab/marketing phrases must not appear in `/me/*` HTTP paths. */
const BANNED_ME_PATH_FRAGMENTS = [
  'plan-needs-you',
  'needs-you',
  'member-hub',
  '/me/hub',
  '/me/plan-',
  'trips/',
];

describe('API surface route naming', () => {
  it('does not register banned surface names on /me/* paths', () => {
    const violations: string[] = [];
    for (const file of collectTsFiles(API_ROUTES)) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      for (const fragment of BANNED_ME_PATH_FRAGMENTS) {
        if (content.includes(`'/me/${fragment}`) || content.includes(`"/me/${fragment}`)) {
          violations.push(`${file}: /me/${fragment}`);
        }
        if (content.includes(`'${fragment}'`) && fragment.startsWith('/me/')) {
          violations.push(`${file}: ${fragment}`);
        }
      }
      if (
        content.includes("'/me/plan-needs-you'") ||
        content.includes("'/me/member-hub-stats'") ||
        content.includes("'/me/trips/map'")
      ) {
        violations.push(`${file}: legacy surface-named route`);
      }
    }
    expect(violations).toEqual([]);
  });
});
