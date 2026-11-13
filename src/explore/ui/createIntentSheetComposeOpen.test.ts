import { describe, expect, it } from 'vitest';
import { composeWireMatchesBrowserLocation } from './createIntentSheetComposeOpen';

describe('composeWireMatchesBrowserLocation', () => {
  it('requires compose wire to match window.location.search', () => {
    window.history.replaceState(null, '', '/explore?compose=host');
    expect(composeWireMatchesBrowserLocation('host')).toBe(true);

    window.history.replaceState(null, '', '/explore');
    expect(composeWireMatchesBrowserLocation('host')).toBe(false);
    expect(composeWireMatchesBrowserLocation(null)).toBe(false);
  });

  it('accepts matching router search when the address bar lags', () => {
    window.history.replaceState(null, '', '/explore');
    expect(composeWireMatchesBrowserLocation('host', { routerSearch: 'compose=host' })).toBe(true);
  });
});
