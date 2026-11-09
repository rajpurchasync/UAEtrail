import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('ConsumerDetailSection responsive chrome', () => {
  it('uses collapsible bars only below lg; desktop keeps bordered corner-label sections', () => {
    const section = read('src/detail/shell/ConsumerDetailSection.tsx');
    expect(section).toMatch(/collapsible/);
    expect(section).toMatch(/lg:hidden/);
    expect(section).toMatch(/hidden.*lg:flex/);
    expect(section).toMatch(/CONSUMER_DETAIL_SECTION_SHELL/);
    expect(section).toMatch(/CategoryLabel/);
    expect(section).not.toMatch(/@min-\[42rem\]\/detail-main:block/);
    expect(section).toMatch(/renderSectionBody/);
  });
});
