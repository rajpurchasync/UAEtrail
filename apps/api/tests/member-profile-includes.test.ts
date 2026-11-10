import { describe, expect, it } from 'vitest';
import { parseMemberProfilePageIncludes } from '../src/services/member-profile-includes.js';

describe('parseMemberProfilePageIncludes', () => {
  it('defaults to no includes', () => {
    expect(parseMemberProfilePageIncludes({})).toEqual({
      socialGraph: false,
      upcoming: false,
      past: false,
    });
  });

  it('honours legacy socialGraph query', () => {
    expect(parseMemberProfilePageIncludes({ socialGraph: '1' })).toEqual({
      socialGraph: true,
      upcoming: false,
      past: false,
    });
  });

  it('parses include tokens', () => {
    expect(parseMemberProfilePageIncludes({ include: 'upcoming,past,socialGraph' })).toEqual({
      socialGraph: true,
      upcoming: true,
      past: true,
    });
  });
});
