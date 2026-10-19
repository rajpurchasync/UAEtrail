import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCAN_ROOT = join(process.cwd(), 'src');

const collectSourceFiles = (dir: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('inboundNamingHygieneGuard', () => {
  it('src has no Legacy-named source files', () => {
    const offenders = collectSourceFiles(SCAN_ROOT).filter((file) => /legacy/i.test(file.split('/').pop() ?? ''));
    expect(offenders).toEqual([]);
  });

  it('src does not export LEGACY_* constants', () => {
    const offenders: string[] = [];
    for (const file of collectSourceFiles(SCAN_ROOT)) {
      if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/export\s+(?:const|function|type|interface|class)\s+LEGACY_/m.test(content)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
