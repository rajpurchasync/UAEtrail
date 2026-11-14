import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const API_DOMAINS = join(process.cwd(), 'src/api/domains');

const FE_LAYOUT_LEAK = /\b(listExplorer|ListDiscoveryExperience|MapPeekShell|embedMode)\b/;

const collectTs = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectTs(full));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      out.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return out;
};

describe('apiUiVocabularyGuard (FE client facades)', () => {
  it('FE-API-01: api/domains stay entity + route oriented (no list explorer layout names)', () => {
    const violations: string[] = [];
    for (const file of collectTs(API_DOMAINS)) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (FE_LAYOUT_LEAK.test(content)) {
        violations.push(file);
      }
    }
    expect(violations).toEqual([]);
  });

  it('FE-API-02: explore client calls catalog endpoints, not parallel list product APIs', () => {
    const explore = readFileSync(join(process.cwd(), 'src/api/domains/explore.ts'), 'utf8');
    expect(explore).toMatch(/\/explore\/map/);
    expect(explore).not.toMatch(/\/list\//);
  });
});