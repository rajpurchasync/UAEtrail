import { describe, expect, it } from 'vitest';
import { messagesMobileThreadVisible } from './messagesMobileThreadVisible';

describe('messagesMobileThreadVisible', () => {
  it('follows inbox URL params', () => {
    expect(messagesMobileThreadVisible(new URLSearchParams())).toBe(false);
    expect(messagesMobileThreadVisible(new URLSearchParams('to=u1'))).toBe(true);
    expect(messagesMobileThreadVisible(new URLSearchParams('group=g1'))).toBe(true);
  });
});