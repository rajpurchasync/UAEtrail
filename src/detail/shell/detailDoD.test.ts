import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (name: string) => readFileSync(join(process.cwd(), 'src/detail/shell', name), 'utf8');

/**
 * Definition of done (plan §5 + §17.3): 360 / 768 / 1280, light+dark, RTL.
 * Node/vitest source assertions — Playwright is not required in verify:system:quick.
 *
 * Viewport checklist (optional visual):
 * - 360px: single column, sticky ActionBar, hero ~40vh
 * - 768px (md): two columns 7/5, no bottom bar
 * - 1280px (lg): 8/4 sticky aside, max-w 1200
 */
describe('detail page DoD (dark / RTL / breakpoints)', () => {
  it('DetailPageShell uses logical CSS, dir, dark: classes, and md/lg breakpoints', () => {
    const shell = read('DetailPageShell.tsx');
    expect(shell).toMatch(/\bdir=/);
    expect(shell).toMatch(/dark:/);
    expect(shell).toMatch(/\bmd:/);
    expect(shell).toMatch(/\blg:/);
    expect(shell).toMatch(/max-w-\[1200px\]/);
    expect(shell).toMatch(/ConsumerDetailSectionJumpNav|jumpRow/);
    expect(shell).toMatch(/\{keyFacts \?/);
    expect(shell).not.toMatch(/className="[^"]*\bleft-/);
    expect(shell).not.toMatch(/className="[^"]*\bright-/);
    expect(shell).toMatch(/inset-inline|ps-|pe-|ms-|me-|start-|end-|logical CSS/);
  });

  it('HeroBanner overlay uses logical inset', () => {
    const hero = read('HeroBanner.tsx');
    expect(hero).toMatch(/inset-s-0|inset-inline|absolute inset/);
    expect(hero).toMatch(/data-detail-hero-banner/);
  });

  it('StatGrid uses inline-start margin for RTL', () => {
    const grid = read('StatGrid.tsx');
    expect(grid).toMatch(/-ms-1|ms-0/);
    expect(grid).toMatch(/dark:/);
  });
});
