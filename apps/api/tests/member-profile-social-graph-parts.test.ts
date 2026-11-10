import { describe, expect, it } from 'vitest';
import { parseMemberProfileSocialGraphParts } from '../src/services/member-profile-social-graph.js';

describe('parseMemberProfileSocialGraphParts', () => {
  it('defaults to full graph', () => {
    expect(parseMemberProfileSocialGraphParts(undefined)).toEqual({
      friends: true,
      commonFollows: true,
    });
    expect(parseMemberProfileSocialGraphParts('')).toEqual({
      friends: true,
      commonFollows: true,
    });
  });

  it('accepts partial parts', () => {
    expect(parseMemberProfileSocialGraphParts('commonFollows')).toEqual({
      friends: false,
      commonFollows: true,
    });
    expect(parseMemberProfileSocialGraphParts('friends')).toEqual({
      friends: true,
      commonFollows: false,
    });
    expect(parseMemberProfileSocialGraphParts('friends,commonFollows')).toEqual({
      friends: true,
      commonFollows: true,
    });
  });
});
