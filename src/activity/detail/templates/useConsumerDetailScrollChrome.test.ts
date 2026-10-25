import { describe, expect, it } from 'vitest';
import { resolveConsumerDetailScrollChrome } from './resolveConsumerDetailScrollChrome';

describe('resolveConsumerDetailScrollChrome', () => {
  it('keeps header soft at top and footer solid when there is no overflow', () => {
    expect(resolveConsumerDetailScrollChrome({ scrollTop: 0, scrollHeight: 400, clientHeight: 400 })).toEqual({
      headerFrosted: false,
      footerFrosted: false,
    });
  });

  it('frost header and footer while mid-scroll with content behind both', () => {
    expect(resolveConsumerDetailScrollChrome({ scrollTop: 120, scrollHeight: 900, clientHeight: 400 })).toEqual({
      headerFrosted: true,
      footerFrosted: true,
    });
  });

  it('drops footer frost at scroll end', () => {
    expect(resolveConsumerDetailScrollChrome({ scrollTop: 500, scrollHeight: 900, clientHeight: 400 })).toEqual({
      headerFrosted: true,
      footerFrosted: false,
    });
  });
});
