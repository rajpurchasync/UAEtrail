import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (name: string) => readFileSync(join(process.cwd(), 'src/detail/shell', name), 'utf8');

describe('DetailPageShell RTL / logical CSS (plan §8)', () => {
  it('uses logical inset and padding classes, not left/right layout anchors', () => {
    const shell = read('DetailPageShell.tsx');
    expect(shell).toMatch(/\bdir=/);
    expect(shell).toMatch(/dir \?= 'inherit'|dir = 'inherit'|dir=\{dir\}/);
    expect(shell).toMatch(/data-detail-page-shell/);
    expect(shell).toMatch(/logical CSS/);
    expect(shell).not.toMatch(/className="[^"]*\bleft-/);
    expect(shell).not.toMatch(/className="[^"]*\bright-/);
  });

  it('StatGrid uses inline-start margin (ms) so RTL mirrors', () => {
    const grid = read('StatGrid.tsx');
    expect(grid).toMatch(/-ms-1/);
    expect(grid).toMatch(/lg:ms-0/);
  });
});
