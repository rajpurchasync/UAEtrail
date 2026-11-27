import { describe, expect, it } from 'vitest';
import { resolveGuestSurfaceForPath } from './guestSurfaceByPath';

describe('resolveGuestSurfaceForPath', () => {
  it('maps member sidebar routes to feature gates', () => {
    expect(resolveGuestSurfaceForPath('/plan')?.feature).toBe('plan');
    expect(resolveGuestSurfaceForPath('/chat')?.feature).toBe('chat');
    expect(resolveGuestSurfaceForPath('/crews')?.feature).toBe('friends');
    expect(resolveGuestSurfaceForPath('/groups')?.feature).toBe('groups');
    expect(resolveGuestSurfaceForPath('/settings/notifications')?.feature).toBe('settings-hub');
    expect(resolveGuestSurfaceForPath('/settings/account')?.feature).toBe('settings-hub');
  });

  it('returns null for public routes', () => {
    expect(resolveGuestSurfaceForPath('/explore')).toBeNull();
    expect(resolveGuestSurfaceForPath('/list')).toBeNull();
    expect(resolveGuestSurfaceForPath('/settings')).toBeNull();
  });
});
