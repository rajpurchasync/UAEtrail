import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('consumer detail in-page scroll', () => {
  it('jump nav uses scrollEntityDetailToId (nested overflow scroller)', () => {
    const jump = readFileSync(join(process.cwd(), 'src/detail/shell/ConsumerDetailSectionJumpNav.tsx'), 'utf8');
    expect(jump).toMatch(/scrollEntityDetailToId/);
    expect(jump).toMatch(/findEntityDetailScrollRoot/);
    expect(jump).toMatch(/preventScrollReset/);
    expect(jump).not.toMatch(/history\.replaceState/);
  });

  it('scroll helper does not write the address bar', () => {
    const scroll = readFileSync(join(process.cwd(), 'src/detail/shell/consumerDetailScrollTo.ts'), 'utf8');
    expect(scroll).not.toMatch(/history\.replaceState/);
    expect(scroll).not.toMatch(/pushState/);
  });

  it('scroll shell marks entity scroll root', () => {
    const shell = readFileSync(
      join(process.cwd(), 'src/components/mobile/MobileDetailScrollShell.tsx'),
      'utf8'
    );
    expect(shell).toMatch(/data-entity-detail-scroll/);
    expect(shell).toMatch(/data-entity-detail-scroll-shell/);
    expect(shell).toMatch(/MobileBackButton/);
  });
});
