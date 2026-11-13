import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  sessionExpiredExplorePath,
  sessionExpiredLandingPath,
  signedOutLandingPath,
  stripSessionExpiredQuery,
} from './authSessionLanding';

const mockMatchMedia = (mobile: boolean) => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: mobile && query.includes('max-width: 767px'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('authSessionLanding', () => {
  it('sends phones to Explore when the session expires', () => {
    mockMatchMedia(true);
    expect(sessionExpiredLandingPath()).toBe(sessionExpiredExplorePath());
    expect(sessionExpiredLandingPath()).toBe('/explore?session=expired');
    expect(signedOutLandingPath()).toBe('/explore');
  });

  it('sends desktop guests to the marketing home', () => {
    mockMatchMedia(false);
    expect(sessionExpiredLandingPath()).toBe('/?session=expired');
    expect(signedOutLandingPath()).toBe('/');
  });

  it('strips session=expired from post-auth return paths', () => {
    expect(stripSessionExpiredQuery('/explore?session=expired')).toBe('/explore');
    expect(stripSessionExpiredQuery('/explore?session=expired&list=1')).toBe('/explore?list=1');
    expect(stripSessionExpiredQuery('/explore?list=1')).toBe('/explore?list=1');
    expect(stripSessionExpiredQuery('/?session=expired#top')).toBe('/#top');
  });
});
