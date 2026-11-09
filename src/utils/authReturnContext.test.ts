import { describe, expect, it } from 'vitest';
import {
  AUTH_RESUME_INVITE_FRIENDS_QUERY,
  AUTH_RESUME_JOIN_QUERY,
  AUTH_RESUME_SHARE_QUERY,
  withAuthResumeInviteFriends,
  withAuthResumeQuery,
  withAuthResumeShare,
  buildAuthGateUrls,
} from './authReturnContext';

describe('withAuthResumeQuery', () => {
  it('appends join=1 to activity paths', () => {
    expect(withAuthResumeQuery('/activity/abc', { join: true })).toBe(
      `/activity/abc?${AUTH_RESUME_JOIN_QUERY}=1`
    );
  });

  it('preserves existing query and hash', () => {
    expect(withAuthResumeQuery('/activity/abc?invite=1#plan', { join: true })).toBe(
      `/activity/abc?invite=1&${AUTH_RESUME_JOIN_QUERY}=1#plan`
    );
  });
});

describe('withAuthResumeInviteFriends', () => {
  it('appends inviteFriends=1', () => {
    expect(withAuthResumeInviteFriends('/activity/abc')).toBe(
      `/activity/abc?${AUTH_RESUME_INVITE_FRIENDS_QUERY}=1`
    );
  });
});

describe('withAuthResumeShare', () => {
  it('appends share=1', () => {
    expect(withAuthResumeShare('/activity/abc')).toBe(
      `/activity/abc?${AUTH_RESUME_SHARE_QUERY}=1`
    );
  });
});

describe('buildAuthGateUrls', () => {
  it('shares redirect, focus, and scroll between sign-in and sign-up', () => {
    const { signInHref, signUpHref, from } = buildAuthGateUrls(
      { pathname: '/explore', search: '?list=1' },
      { returnPath: '/activity/x', focusSelector: '[data-activity-join-cta]' }
    );
    expect(from).toBe('/activity/x');
    expect(signInHref).toContain('redirect=%2Factivity%2Fx');
    expect(signUpHref).toContain('redirect=%2Factivity%2Fx');
    expect(signInHref).toContain('focus=');
    expect(signUpHref).toContain('focus=');
  });
});
