import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCAN_ROOTS = [
  join(process.cwd(), 'src'),
  join(process.cwd(), 'apps/api/src'),
  join(process.cwd(), 'packages/shared-types/src'),
];

const collectSourceFiles = (dir: string): string[] => {
  if (!existsSync(dir)) return [];
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

const allSourceFiles = (): string[] => SCAN_ROOTS.flatMap((root) => collectSourceFiles(root));

describe('inboundNamingHygieneGuard', () => {
  it('product trees have no Legacy-named source files', () => {
    const offenders = allSourceFiles().filter((file) => /legacy/i.test(file.split('/').pop() ?? ''));
    expect(offenders).toEqual([]);
  });

  it('product trees do not export LEGACY_* constants', () => {
    const offenders: string[] = [];
    for (const file of allSourceFiles()) {
      if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/export\s+(?:const|function|type|interface|class)\s+LEGACY_/m.test(content)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
