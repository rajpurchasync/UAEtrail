import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyNavigation,
  inferBackParent,
  isTransientBackPath,
  navigateBack,
  recordNavigation,
  resetBackStack,
  resolveBackTarget,
  resolveTransientPopSkip,
  type BackStackState,
} from './backStack';
import { resolveBackLabel } from './backLabel';
import { takeArmedViewReturn } from './viewReturnMemory';

const stackOf = (paths: string[], index = paths.length - 1): BackStackState => ({
  entries: paths.map((path, i) => ({ key: `k${i}`, path })),
  index,
});

describe('applyNavigation', () => {
  it('push truncates forward entries', () => {
    let s = applyNavigation({ entries: [], index: -1 }, { key: 'a', path: '/explore' }, 'POP');
    s = applyNavigation(s, { key: 'b', path: '/plan' }, 'PUSH');
    s = applyNavigation(s, { key: 'c', path: '/activity/1' }, 'PUSH');
    s = applyNavigation(s, { key: 'b', path: '/plan' }, 'POP');
    expect(s.index).toBe(1);
    s = applyNavigation(s, { key: 'd', path: '/chat' }, 'PUSH');
    expect(s.entries.map((e) => e.path)).toEqual(['/explore', '/plan', '/chat']);
    expect(s.index).toBe(2);
  });

  it('replace swaps the current entry', () => {
    let s = applyNavigation({ entries: [], index: -1 }, { key: 'a', path: '/explore' }, 'POP');
    s = applyNavigation(s, { key: 'b', path: '/signin' }, 'PUSH');
    s = applyNavigation(s, { key: 'c', path: '/explore' }, 'REPLACE');
    expect(s.entries.map((e) => e.path)).toEqual(['/explore', '/explore']);
    expect(s.index).toBe(1);
  });

  it('pop to an unknown entry starts a fresh stack (deep link / fresh tab)', () => {
    const s = applyNavigation(stackOf(['/explore', '/plan']), { key: 'zz', path: '/activity/9/edit' }, 'POP');
    expect(s).toEqual({ entries: [{ key: 'zz', path: '/activity/9/edit' }], index: 0 });
  });
});

describe('applyNavigation with router history index', () => {
  it('mirrors browser positions and truncates forward entries on push', () => {
    let s = applyNavigation({ entries: [], index: -1 }, { key: 'default', path: '/explore' }, 'POP', 0);
    s = applyNavigation(s, { key: 'b', path: '/plan' }, 'PUSH', 1);
    s = applyNavigation(s, { key: 'c', path: '/activity/1' }, 'PUSH', 2);
    s = applyNavigation(s, { key: 'b', path: '/plan' }, 'POP', 1);
    s = applyNavigation(s, { key: 'd', path: '/chat' }, 'PUSH', 2);
    expect(s.entries.map((e) => e.path)).toEqual(['/explore', '/plan', '/chat']);
    expect(s.index).toBe(2);
  });

  it('a typed URL (new document, reused `default` key) becomes a new entry above the current one', () => {
    let s = applyNavigation({ entries: [], index: -1 }, { key: 'default', path: '/explore' }, 'POP', 0);
    s = applyNavigation(s, { key: 'b', path: '/plan' }, 'PUSH', 1);
    s = applyNavigation(s, { key: 'default', path: '/profile/vehicles/car-1/edit' }, 'POP', 2);
    expect(s.entries.map((e) => e.path)).toEqual(['/explore', '/plan', '/profile/vehicles/car-1/edit']);
    expect(s.index).toBe(2);
    // Browser back from the typed page lands on the known entry underneath.
    s = applyNavigation(s, { key: 'b', path: '/plan' }, 'POP', 1);
    expect(s.index).toBe(1);
  });

  it('reload keeps the same position', () => {
    let s = applyNavigation({ entries: [], index: -1 }, { key: 'default', path: '/explore' }, 'POP', 0);
    s = applyNavigation(s, { key: 'b', path: '/plan' }, 'PUSH', 1);
    s = applyNavigation(s, { key: 'b', path: '/plan' }, 'POP', 1);
    expect(s).toEqual({
      entries: [
        { key: 'default', path: '/explore' },
        { key: 'b', path: '/plan' },
      ],
      index: 1,
    });
  });

  it('never pops into history positions it did not create', () => {
    // Storage cleared / arrived from another site at browser index 3.
    const s = applyNavigation({ entries: [], index: -1 }, { key: 'default', path: '/activity/abc' }, 'POP', 3);
    expect(s.index).toBe(3);
    expect(resolveBackTarget(s, '/activity/abc', '/explore')).toEqual({ kind: 'fallback', path: '/explore' });
    const next = applyNavigation(s, { key: 'x', path: '/member/u1' }, 'PUSH', 4);
    expect(resolveBackTarget(next, '/member/u1', '/explore')).toEqual({
      kind: 'pop',
      delta: 1,
      path: '/activity/abc',
    });
  });
});

describe('isTransientBackPath', () => {
  it('flags auth and form screens', () => {
    expect(isTransientBackPath('/signin')).toBe(true);
    expect(isTransientBackPath('/verify')).toBe(true);
    expect(isTransientBackPath('/profile/edit')).toBe(true);
    expect(isTransientBackPath('/profile/vehicles/new')).toBe(true);
    expect(isTransientBackPath('/profile/vehicles/car-1/edit')).toBe(true);
    expect(isTransientBackPath('/activity/abc')).toBe(false);
    expect(isTransientBackPath('/plan')).toBe(false);
  });
});

describe('resolveBackTarget', () => {
  it('deep-linked edit: back opens the item, then the item opens its parent (no in-app history)', () => {
    const onEdit = stackOf(['/profile/vehicles/car-1/edit']);
    expect(resolveBackTarget(onEdit, '/profile/vehicles/car-1/edit', '/profile/vehicles')).toEqual({
      kind: 'fallback',
      path: '/profile/vehicles',
    });
    // Back replaced the edit entry with the item.
    const onItem = applyNavigation(onEdit, { key: 'k1', path: '/profile/vehicles' }, 'REPLACE');
    expect(resolveBackTarget(onItem, '/profile/vehicles', '/profile')).toEqual({
      kind: 'fallback',
      path: '/profile',
    });
  });

  it('in-app flow pops to the actual opener, not the hard-wired parent', () => {
    const s = stackOf(['/explore', '/plan?tab=upcoming', '/activity/abc']);
    expect(resolveBackTarget(s, '/activity/abc', '/explore')).toEqual({
      kind: 'pop',
      delta: 1,
      path: '/plan?tab=upcoming',
    });
  });

  it('skips peer notification settings panels so Saved map returns to Settings', () => {
    const s = stackOf([
      '/settings',
      '/settings/notifications',
      '/settings/notifications/preferences',
      '/settings/notifications/saved',
    ]);
    expect(resolveBackTarget(s, '/settings/notifications/saved', '/settings')).toEqual({
      kind: 'pop',
      delta: 3,
      path: '/settings',
    });
  });

  it('skips transient screens underneath (edit → save landed on the item)', () => {
    const s = stackOf(['/plan', '/activity/abc', '/activity/abc/edit', '/activity/abc']);
    expect(resolveBackTarget(s, '/activity/abc', '/explore')).toEqual({
      kind: 'pop',
      delta: 3,
      path: '/plan',
    });
  });

  it('skips the auth screens between the opener and the landed screen', () => {
    const s = stackOf(['/explore?panel=venues', '/signin', '/signup', '/profile']);
    expect(resolveBackTarget(s, '/profile', '/explore')).toEqual({
      kind: 'pop',
      delta: 3,
      path: '/explore?panel=venues',
    });
  });

  it('ignores tab / filter churn on the same route when the parent is another route', () => {
    const s = stackOf(['/explore', '/plan?tab=upcoming', '/plan?tab=wishlist']);
    expect(resolveBackTarget(s, '/plan?tab=wishlist', '/explore')).toEqual({
      kind: 'pop',
      delta: 2,
      path: '/explore',
    });
  });

  it('pops within the same route when the declared parent is that route (thread → inbox)', () => {
    const s = stackOf(['/explore', '/chat', '/chat?to=member-1']);
    expect(resolveBackTarget(s, '/chat?to=member-1', '/chat')).toEqual({
      kind: 'pop',
      delta: 1,
      path: '/chat',
    });
  });

  it('falls back to the declared parent when only the current screen is on the stack', () => {
    const s = stackOf(['/activity/abc']);
    expect(resolveBackTarget(s, '/activity/abc', '/explore')).toEqual({ kind: 'fallback', path: '/explore' });
  });

  it('never pops forward entries', () => {
    const s = stackOf(['/explore', '/plan', '/activity/abc'], 0);
    expect(resolveBackTarget(s, '/explore', '/')).toEqual({ kind: 'fallback', path: '/' });
  });

  it('pasted edit URL does not pop to an unrelated earlier screen — it opens the item', () => {
    const s = stackOf(['/explore', '/plan?tab=upcoming', '/profile/vehicles/car-1/edit']);
    expect(resolveBackTarget(s, '/profile/vehicles/car-1/edit', '/profile/vehicles')).toEqual({
      kind: 'fallback',
      path: '/profile/vehicles',
    });
  });

  it('in-app edit still pops to the item that opened it', () => {
    const s = stackOf(['/profile', '/profile/vehicles', '/profile/vehicles/car-1/edit']);
    expect(resolveBackTarget(s, '/profile/vehicles/car-1/edit', '/profile/vehicles')).toEqual({
      kind: 'pop',
      delta: 1,
      path: '/profile/vehicles',
    });
  });

  it('dismissing sign-in skips gated profile and returns to the public opener', () => {
    const s = stackOf(['/explore?panel=venues', '/profile', '/signin']);
    expect(
      resolveBackTarget(s, '/signin', '/explore', { skipPath: (path) => path === '/profile' || path.startsWith('/profile/') })
    ).toEqual({
      kind: 'pop',
      delta: 2,
      path: '/explore?panel=venues',
    });
  });

  it('sanitizes a transient fallback to the item parent', () => {
    const s = stackOf(['/profile/vehicles/car-1/edit']);
    expect(resolveBackTarget(s, '/profile/vehicles/car-1/edit', '/profile/edit')).toEqual({
      kind: 'fallback',
      path: '/profile',
    });
  });
});

describe('inferBackParent', () => {
  it('maps form and hub screens to their item/parent', () => {
    expect(inferBackParent('/profile/vehicles/car-1/edit')).toBe('/profile/vehicles');
    expect(inferBackParent('/profile/edit')).toBe('/profile');
    expect(inferBackParent('/signin')).toBe('/');
    expect(inferBackParent('/settings/account')).toBe('/settings');
    expect(inferBackParent('/profile/settings/account')).toBe('/settings');
    expect(inferBackParent('/settings/safety')).toBe('/profile');
    expect(inferBackParent('/my-requests/req-1')).toBe('/my-requests');
  });
});

describe('resolveTransientPopSkip', () => {
  it('leaves a pasted edit URL alone on first load', () => {
    const s = stackOf(['/profile/vehicles/car-1/edit']);
    expect(resolveTransientPopSkip(s, '/profile/vehicles/car-1/edit', null, '/profile/vehicles')).toBeNull();
  });

  it('skips edit after a PUSH-to-item and opens the item parent instead of ping-ponging', () => {
    const s = stackOf(['/profile/vehicles/car-1/edit', '/profile/vehicles'], 0);
    expect(
      resolveTransientPopSkip(s, '/profile/vehicles/car-1/edit', '/profile/vehicles', '/profile/vehicles')
    ).toEqual({
      kind: 'fallback',
      path: '/profile',
    });
  });
});

describe('resolveBackLabel', () => {
  it('names the real destination when it differs from the declared parent', () => {
    expect(
      resolveBackLabel({ kind: 'pop', delta: 1, path: '/plan?tab=upcoming' }, '/explore', 'Explore')
    ).toBe('My Plans');
    expect(resolveBackLabel({ kind: 'pop', delta: 1, path: '/settings' }, '/profile', 'Profile')).toBe(
      'Settings'
    );
    expect(resolveBackLabel({ kind: 'pop', delta: 1, path: '/member/u1' }, '/explore', 'Explore')).toBe('Back');
  });

  it('keeps the declared label on the declared parent route or on fallback', () => {
    expect(resolveBackLabel({ kind: 'pop', delta: 1, path: '/chat' }, '/chat', 'Chat')).toBe('Chat');
    expect(resolveBackLabel({ kind: 'fallback', path: '/explore' }, '/explore', 'Explore')).toBe('Explore');
  });
});

describe('navigateBack', () => {
  beforeEach(() => {
    resetBackStack();
  });

  it('pops history and arms the landing screen for scroll/focus restore', () => {
    recordNavigation('a', '/plan', 'POP');
    recordNavigation('b', '/activity/abc', 'PUSH');
    window.history.replaceState(null, '', '/activity/abc');
    const navigate = vi.fn();
    navigateBack(navigate, '/explore');
    expect(navigate).toHaveBeenCalledWith(-1);
    expect(takeArmedViewReturn('/plan')).toEqual({ focusSelector: null });
  });

  it('replaces with the declared parent when there is no in-app history', () => {
    recordNavigation('a', '/activity/abc/edit', 'POP');
    window.history.replaceState(null, '', '/activity/abc/edit');
    const navigate = vi.fn();
    navigateBack(navigate, '/activity/abc');
    expect(navigate).toHaveBeenCalledWith('/activity/abc', { replace: true });
    expect(takeArmedViewReturn('/activity/abc')).toEqual({ focusSelector: null });
  });

  it('pasted edit with unrelated history underneath replaces to the item, not the earlier screen', () => {
    recordNavigation('a', '/plan', 'POP');
    recordNavigation('b', '/profile/vehicles/car-1/edit', 'PUSH');
    window.history.replaceState(null, '', '/profile/vehicles/car-1/edit');
    const navigate = vi.fn();
    navigateBack(navigate, '/profile/vehicles');
    expect(navigate).toHaveBeenCalledWith('/profile/vehicles', { replace: true });
    expect(takeArmedViewReturn('/profile/vehicles')).toEqual({ focusSelector: null });
  });

  it('ignores re-renders of the same router entry', () => {
    recordNavigation('a', '/plan', 'POP');
    recordNavigation('b', '/activity/abc', 'PUSH');
    recordNavigation('b', '/activity/abc', 'PUSH');
    window.history.replaceState(null, '', '/activity/abc');
    const navigate = vi.fn();
    navigateBack(navigate, '/explore');
    expect(navigate).toHaveBeenCalledWith(-1);
  });
});
