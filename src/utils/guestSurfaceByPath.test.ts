import { describe, expect, it } from 'vitest';
import { resolveGuestSurfaceForPath } from './guestSurfaceByPath';

describe('resolveGuestSurfaceForPath', () => {
  it('maps member sidebar routes to feature gates', () => {
    expect(resolveGuestSurfaceForPath('/plan')?.feature).toBe('plan');
    expect(resolveGuestSurfaceForPath('/chat')?.feature).toBe('chat');
    expect(resolveGuestSurfaceForPath('/buddies')?.feature).toBe('friends');
    expect(resolveGuestSurfaceForPath('/groups')?.feature).toBe('groups');
    expect(resolveGuestSurfaceForPath('/notifications')?.feature).toBe('notifications');
    expect(resolveGuestSurfaceForPath('/profile/settings/account')?.feature).toBe('settings-hub');
  });

  it('returns null for public routes', () => {
    expect(resolveGuestSurfaceForPath('/explore')).toBeNull();
    expect(resolveGuestSurfaceForPath('/list')).toBeNull();
  });
});
