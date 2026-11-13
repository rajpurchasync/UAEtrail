import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (name: string) => readFileSync(join(process.cwd(), 'src/detail', name), 'utf8');

describe('detail hero mobile top chrome', () => {
  it('positions trip-alert / share on photo upper-right (no double header-pad offset)', () => {
    const chrome = read('shared/detailHeroMobileTopChrome.ts');
    const strip = read('shared/DetailHeroPhotoStrip.tsx');
    const banner = read('shell/HeroBanner.tsx');
    expect(chrome).toMatch(/\btop-3\b/);
    expect(chrome).not.toMatch(/max-md:top-\[calc\(var\(--detail-header-pad/);
    expect(chrome).toMatch(/z-20/);
    expect(strip).toMatch(/DETAIL_HERO_MOBILE_TOP_CHROME_CLASS/);
    expect(banner).toMatch(/DETAIL_HERO_MOBILE_TOP_CHROME_CLASS/);
    expect(strip).not.toMatch(/topEndAction[\s\S]*z-30/);
  });
});
