import { describe, expect, it } from 'vitest';
import { readBrowserLocationSnapshot, snapshotLocationUrl } from './routerLocationReconcile';

describe('routerLocationReconcile', () => {
  it('snapshots pathname search hash', () => {
    expect(snapshotLocationUrl('/explore', '?compose=host', '#peek')).toBe(
      '/explore?compose=host#peek'
    );
  });

  it('reads the live browser URL', () => {
    window.history.replaceState(null, '', '/plan?tab=joined');
    expect(readBrowserLocationSnapshot()).toBe('/plan?tab=joined');
  });
});
