import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isExploreHubSessionPreservePath,
  sessionExpiredExplorePath,
  sessionExpiredLandingPath,
  signedOutLandingPath,
  stripSessionExpiredQuery,
  withSessionExpiredQuery,
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
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('authSessionLanding', () => {
  it('withSessionExpiredQuery merges into existing search', () => {
    expect(withSessionExpiredQuery('/explore', 'list=1')).toBe('/explore?list=1&session=expired');
    expect(withSessionExpiredQuery('/explore/search')).toBe('/explore/search?session=expired');
  });

  it('isExploreHubSessionPreservePath covers search results and legacy hub URLs', () => {
    expect(isExploreHubSessionPreservePath('/explore/search')).toBe(true);
    expect(isExploreHubSessionPreservePath('/explore/hub/search')).toBe(true);
    expect(isExploreHubSessionPreservePath('/explore')).toBe(false);
  });

  describe('legacy explore landing', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', '');
    });

    it('sends phones to Explore when the session expires', async () => {
      vi.resetModules();
      const mod = await import('./authSessionLanding');
      mockMatchMedia(true);
      expect(mod.sessionExpiredLandingPath()).toBe(mod.sessionExpiredExplorePath());
      expect(mod.sessionExpiredLandingPath()).toBe('/explore?session=expired');
      expect(mod.signedOutLandingPath()).toBe('/explore');
    });

    it('sends desktop guests to the marketing home', async () => {
      vi.resetModules();
      const mod = await import('./authSessionLanding');
      mockMatchMedia(false);
      expect(mod.sessionExpiredLandingPath()).toBe('/?session=expired');
      expect(mod.signedOutLandingPath()).toBe('/');
    });
  });

  it('keeps search results when session dies on /explore/search', async () => {
    vi.resetModules();
    const mod = await import('./authSessionLanding');
    mockMatchMedia(true);
    window.history.replaceState(null, '', '/explore/search?q=dubai');
    expect(mod.sessionExpiredLandingPath()).toBe('/explore/search?q=dubai&session=expired');
  });

  it('strips session=expired from post-auth return paths', () => {
    expect(stripSessionExpiredQuery('/explore?session=expired')).toBe('/explore');
    expect(stripSessionExpiredQuery('/explore?session=expired&list=1')).toBe('/explore?list=1');
    expect(stripSessionExpiredQuery('/explore?list=1')).toBe('/explore?list=1');
    expect(stripSessionExpiredQuery('/?session=expired#top')).toBe('/#top');
    expect(stripSessionExpiredQuery('/explore/search?session=expired')).toBe('/explore/search');
  });
});

// Re-export for tests that import explore path constant without hub gate
describe('sessionExpiredExplorePath', () => {
  it('targets legacy explore map', () => {
    expect(sessionExpiredExplorePath()).toBe('/explore?session=expired');
  });
});