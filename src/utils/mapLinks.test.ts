import { describe, expect, it } from 'vitest';
import { buildNavigationUrl, listNavigationAppOptions } from './mapLinks';

describe('mapLinks', () => {
  it('builds drive URLs per app', () => {
    expect(buildNavigationUrl('google', 25.1, 55.2, 'drive')).toContain('google.com/maps/dir');
    expect(buildNavigationUrl('waze', 25.1, 55.2, 'drive')).toContain('waze.com/ul');
    expect(buildNavigationUrl('apple', 25.1, 55.2, 'drive')).toContain('maps.apple.com');
  });

  it('lists google and waze on all platforms', () => {
    const ids = listNavigationAppOptions().map((o) => o.id);
    expect(ids).toContain('google');
    expect(ids).toContain('waze');
  });
});
