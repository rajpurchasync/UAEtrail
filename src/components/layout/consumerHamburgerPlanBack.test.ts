import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('consumer hamburger → My Plans back chrome', () => {
  it('passes explore return state when opening plan from explore routes', () => {
    const menu = read('src/components/layout/MobileMenu.tsx');
    expect(menu).toMatch(/resolveConsumerHamburgerLinkState/);
    expect(menu).toMatch(/exploreMapMobileBackState/);
    expect(menu).toMatch(/state=\{linkState\}/);
  });
});
