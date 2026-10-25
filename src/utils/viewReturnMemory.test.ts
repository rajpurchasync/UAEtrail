import { describe, expect, it } from 'vitest';
import { APP_SCROLL_ROOT_ID } from '../config/layoutScroll';
import {
  applyViewReturnSnapshot,
  armViewReturn,
  captureLeavingView,
  focusSelectorFromElement,
  peekViewReturnSnapshot,
  takeArmedViewReturn,
  viewReturnPathKey,
} from './viewReturnMemory';

describe('viewReturnMemory', () => {
  it('keys a path without the hash', () => {
    expect(viewReturnPathKey('/explore', '?list=1')).toBe('/explore?list=1');
    expect(viewReturnPathKey('/profile/settings#ios-install')).toBe('/profile/settings');
  });

  it('prefers data-nav-focus over href', () => {
    const link = document.createElement('a');
    link.href = '/profile/vehicles';
    link.setAttribute('data-nav-focus', 'vehicle-1');
    const icon = document.createElement('span');
    link.append(icon);
    expect(focusSelectorFromElement(icon)).toBe('[data-nav-focus="vehicle-1"]');
  });

  it('restores scroll and focuses the control that opened the next screen', () => {
    const root = document.createElement('div');
    root.id = APP_SCROLL_ROOT_ID;
    const body = document.createElement('div');
    body.className = 'app-scroll-body';
    body.scrollTop = 240;
    const row = document.createElement('a');
    row.setAttribute('data-nav-focus', 'safety');
    row.href = '/profile/settings/safety';
    row.tabIndex = 0;
    body.append(row);
    root.append(body);
    document.body.append(root);

    captureLeavingView('/profile/settings');
    const snapshot = peekViewReturnSnapshot('/profile/settings');
    expect(snapshot?.scrollTops).toEqual([240]);
    expect(snapshot?.focusSelector).toBeNull();

    body.scrollTop = 0;
    armViewReturn('/profile/settings', '[data-nav-focus="safety"]');
    const armed = takeArmedViewReturn('/profile/settings');
    expect(applyViewReturnSnapshot(snapshot!, armed?.focusSelector)).toBe(true);
    expect(body.scrollTop).toBe(240);
    expect(document.activeElement).toBe(row);

    root.remove();
  });
});
