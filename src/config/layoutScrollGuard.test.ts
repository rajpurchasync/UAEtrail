import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { isDelegatedProductScrollPath, PRODUCT_SHELL_HTML_CLASS } from './layoutScroll';

const ALLOW_MIN_H_SCREEN = new Set([
  'src/pages/Home.tsx',
  'src/components/layout/Layout.tsx',
  'src/components/activities/ActivityPreviewOverlay.tsx',
]);

const walkTsx = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (name === 'node_modules') continue;
      walkTsx(full, out);
    } else if (name.endsWith('.tsx')) {
      out.push(full.replace(/\\/g, '/'));
    }
  }
  return out;
};

describe('layoutScrollGuard', () => {
  it('locks document scroll via ProductShell html class', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/layout/ProductShell.tsx'), 'utf8');
    expect(source).toContain('PRODUCT_SHELL_HTML_CLASS');
    expect(readFileSync(join(process.cwd(), 'src/index.css'), 'utf8')).toContain(
      `html.${PRODUCT_SHELL_HTML_CLASS}`
    );
    expect(source).toMatch(/document\.documentElement\.classList\.add/);
  });

  it('delegates scroll only on list discovery', () => {
    expect(isDelegatedProductScrollPath('/list')).toBe(true);
    expect(isDelegatedProductScrollPath('/explore')).toBe(false);
    expect(isDelegatedProductScrollPath('/messages')).toBe(false);
  });

  it('product UI avoids min-h-screen outside marketing/fullscreen overlays', () => {
    const root = join(process.cwd(), 'src');
    const files = walkTsx(root);
    const violations: string[] = [];
    for (const file of files) {
      const rel = file.replace(`${process.cwd().replace(/\\/g, '/')}/`, '');
      if (ALLOW_MIN_H_SCREEN.has(rel)) continue;
      const source = readFileSync(file, 'utf8');
      if (/\bmin-h-screen\b/.test(source)) {
        violations.push(rel);
      }
    }
    expect(violations).toEqual([]);
  });
});
