import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('consumer detail in-page scroll', () => {
  it('jump nav uses scrollConsumerDetailToId (nested overflow scroller)', () => {
    const jump = readFileSync(join(process.cwd(), 'src/detail/shell/ConsumerDetailSectionJumpNav.tsx'), 'utf8');
    expect(jump).toMatch(/scrollConsumerDetailToId/);
    expect(jump).toMatch(/findConsumerDetailScrollRoot/);
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
