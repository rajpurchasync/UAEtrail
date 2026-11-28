import { describe, expect, it } from 'vitest';
import { resolveViewerAnchorGeo } from './viewerAnchor';

describe('resolveViewerAnchorGeo', () => {
  it('prefers saved anchor over session fix', () => {
    expect(
      resolveViewerAnchorGeo(
        { lat: 25.0, lng: 55.0 },
        { label: 'Hatta', query: 'Hatta', lat: 24.82, lng: 56.13, source: 'search' }
      )
    ).toEqual({ lat: 24.82, lng: 56.13 });
  });

  it('falls back to session fix', () => {
    expect(resolveViewerAnchorGeo({ lat: 25.1, lng: 55.2 }, null)).toEqual({ lat: 25.1, lng: 55.2 });
  });
});