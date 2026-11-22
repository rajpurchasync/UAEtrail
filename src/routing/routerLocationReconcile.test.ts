import { describe, expect, it } from 'vitest';
import {
  pickRouteMatchLocation,
  readBrowserLocationSnapshot,
  snapshotLocationUrl,
} from './routerLocationReconcile';

describe('routerLocationReconcile', () => {
  it('snapshots pathname search hash', () => {
    expect(snapshotLocationUrl('/explore', '?compose=activity:hiking', '#peek')).toBe(
      '/explore?compose=activity:hiking#peek'
    );
  });

  it('reads the live browser URL', () => {
    window.history.replaceState(null, '', '/plan?tab=joined');
    expect(readBrowserLocationSnapshot()).toBe('/plan?tab=joined');
  });

  it('prefers router when it is a child of the address bar path', () => {
    const router = { pathname: '/explore/hub/home', search: '', hash: '' };
    const browser = { pathname: '/explore/hub', search: '', hash: '' };
    expect(pickRouteMatchLocation(router, browser)).toBe(router);
  });

  it('prefers browser when it is a child of the router path', () => {
    const router = { pathname: '/explore/hub', search: '', hash: '' };
    const browser = { pathname: '/explore/hub/home', search: '', hash: '' };
    expect(pickRouteMatchLocation(router, browser)).toBe(browser);
  });

  it('prefers browser on unrelated pathname desync', () => {
    const router = { pathname: '/explore', search: '', hash: '' };
    const browser = { pathname: '/list', search: '', hash: '' };
    expect(pickRouteMatchLocation(router, browser)).toBe(browser);
  });
});
