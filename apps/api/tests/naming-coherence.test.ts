import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const API_SRC = join(process.cwd(), 'src');

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

describe('naming coherence (API)', () => {
  it('does not write buddyUserId in notification meta (use actorUserId)', () => {
    const roots = [join(API_SRC, 'services'), join(API_SRC, 'routes')];
    const violations: string[] = [];

    for (const root of roots) {
      for (const file of collectTsFiles(root)) {
        const content = readFileSync(join(process.cwd(), file), 'utf8');
        if (/buddyUserId\s*:/.test(content)) {
          violations.push(`${file}: use actorUserId — ids are member user ids, not buddy entities`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('buddy notification services set actorUserId on connection payloads', () => {
    const buddyNotif = readFileSync(join(API_SRC, 'services', 'buddy-notifications.ts'), 'utf8');
    expect(buddyNotif).toMatch(/actorUserId:/);
    expect(buddyNotif).not.toMatch(/buddyUserId\s*:/);
    expect(buddyNotif).not.toMatch(/fromUserId:\s*input/);
  });

  it('social notification services set actorUserId on actionable payloads', () => {
    const socialNotif = readFileSync(join(API_SRC, 'services', 'social-notifications.ts'), 'utf8');
    const metaBlocks = socialNotif.match(/meta:\s*\{[\s\S]*?\n\s*\},/g) ?? [];
    expect(metaBlocks.length).toBeGreaterThanOrEqual(3);
    for (const block of metaBlocks) {
      expect(block).toMatch(/actorUserId:/);
      expect(block).not.toMatch(/\binvitedByUserId:/);
      expect(block).not.toMatch(/\bauthorUserId:/);
    }
  });
});
