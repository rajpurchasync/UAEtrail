import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('consumer detail in-page scroll', () => {
  it('jump nav uses scrollConsumerDetailToId (nested overflow scroller)', () => {
    const jump = readFileSync(join(process.cwd(), 'src/detail/shell/ConsumerDetailSectionJumpNav.tsx'), 'utf8');
    expect(jump).toMatch(/scrollConsumerDetailToId/);
    expect(jump).toMatch(/findConsumerDetailScrollRoot/);
  });

  it('modal shell marks header and scroll root', () => {
    const shell = readFileSync(
      join(process.cwd(), 'src/activity/detail/templates/ActivityConsumerDetailModalShell.tsx'),
      'utf8'
    );
    expect(shell).toMatch(/data-consumer-detail-scroll/);
    expect(shell).toMatch(/data-consumer-detail-modal-header/);
    expect(shell).toMatch(/closeTo/);
  });
});
