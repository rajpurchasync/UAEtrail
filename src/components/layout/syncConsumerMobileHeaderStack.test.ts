import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('syncConsumerMobileHeaderStack', () => {
  it('defines CSS token and measures hub identity header first', () => {
    const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');
    expect(css).toMatch(/--consumer-mobile-header-stack:/);
    expect(css).toMatch(/data-hub-identity-header/);

    const source = readFileSync(
      join(process.cwd(), 'src/components/layout/syncConsumerMobileHeaderStack.ts'),
      'utf8'
    );
    expect(source).toMatch(/data-hub-identity-header/);
    expect(source.indexOf('data-hub-identity-header')).toBeLessThan(
      source.indexOf('data-consumer-chrome-header')
    );
  });
});