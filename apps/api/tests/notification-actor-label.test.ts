import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../src/lib/auth-users.js', () => ({
  findAuthUserById: vi.fn(),
}));

vi.mock('../src/services/profile-viewer-access.js', () => ({
  resolveProfileViewerAccess: vi.fn(),
  canViewProfileField: vi.fn(),
}));

import { findAuthUserById } from '../src/lib/auth-users.js';
import {
  canViewProfileField,
  resolveProfileViewerAccess,
} from '../src/services/profile-viewer-access.js';
import { resolveNotificationActorDisplayName } from '../src/services/notification-actor-label.js';

const mockedUser = vi.mocked(findAuthUserById);
const mockedAccess = vi.mocked(resolveProfileViewerAccess);
const mockedCanView = vi.mocked(canViewProfileField);

describe('resolveNotificationActorDisplayName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns fallback when identity is not visible', async () => {
    mockedUser.mockResolvedValue({
      _id: 'actor-1',
      email: 'hidden@example.com',
      profile: { displayName: 'Hidden', profileVisibility: 'private' },
    } as never);
    mockedAccess.mockResolvedValue({
      level: 'denied',
      canViewFullProfile: false,
      sharesGroup: false,
      sharesAcceptedActivity: false,
    });
    mockedCanView.mockReturnValue(false);

    const label = await resolveNotificationActorDisplayName('actor-1', 'recipient-1');
    expect(label).toBe('Someone on UAE Trail');
  });

  it('returns display name when viewer may see identity', async () => {
    mockedUser.mockResolvedValue({
      _id: 'actor-1',
      email: 'open@example.com',
      profile: { displayName: 'Sara', profileVisibility: 'public' },
    } as never);
    mockedAccess.mockResolvedValue({
      level: 'public',
      canViewFullProfile: true,
      sharesGroup: false,
      sharesAcceptedActivity: false,
    });
    mockedCanView.mockReturnValue(true);

    const label = await resolveNotificationActorDisplayName('actor-1', 'recipient-1');
    expect(label).toBe('Sara');
  });
});
