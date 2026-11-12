import { describe, expect, it } from 'vitest';
import { notificationsInboxMobileBackState } from './mobileBackNav';

describe('notificationsInboxMobileBackState', () => {
  it('labels Explore when opened from the map bell', () => {
    expect(notificationsInboxMobileBackState('/explore')).toEqual({
      from: '/explore',
      backLabel: 'Explore',
    });
    expect(notificationsInboxMobileBackState('/explore', '?list=1')).toEqual({
      from: '/explore?list=1',
      backLabel: 'Explore',
    });
  });

  it('labels Profile when opened from the profile hub', () => {
    expect(notificationsInboxMobileBackState('/profile')).toEqual({
      from: '/profile',
      backLabel: 'Profile',
    });
  });

  it('labels Settings only when opened from the settings hub', () => {
    expect(notificationsInboxMobileBackState('/settings')).toEqual({
      from: '/settings',
      backLabel: 'Settings',
    });
  });
});
