import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('weatherChipStyles', () => {
  it('defines light and dark chip shells', () => {
    const src = readFileSync(join(process.cwd(), 'src/detail/weather/weatherChipStyles.ts'), 'utf8');
    expect(src).toMatch(/dark:bg-neutral-900/);
    expect(src).toMatch(/bg-white\/95/);
    expect(src).toMatch(/w-\[5\.65rem\]/);
    expect(src).toMatch(/h-\[5\.85rem\]/);
    expect(src).toMatch(/WEATHER_DAY_CHIP_SHELL_LINK/);
  });
});
