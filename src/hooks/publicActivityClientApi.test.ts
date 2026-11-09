import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../api/index', () => ({
  api: {
    getPublicActivityDetail: vi.fn(),
    getPublicActivityMeState: vi.fn(),
  },
}));

vi.mock('../api/client', () => ({
  getStoredSession: vi.fn(() => ({ accessToken: 'token' })),
  USER_STORAGE_KEY: 'uaetrail_user',
}));

import { api } from '../api/index';
import { fetchPublicActivityDetail } from './publicActivityClientApi';

describe('fetchPublicActivityDetail', () => {
  beforeEach(() => {
    vi.mocked(api.getPublicActivityDetail).mockResolvedValue({
      data: { id: 'a1', title: 'Guest preview' },
      viewerAccess: { gateReason: 'sign_in', exposure: 'none' },
      presentation: null,
    } as never);
    vi.mocked(api.getPublicActivityMeState).mockResolvedValue({
      data: { id: 'a1', title: 'Full detail', description: 'Secret' },
      viewerAccess: { gateReason: null, exposure: 'full' },
      presentation: {},
    } as never);
  });

  it('does not load member overlay when viewerUserId is null (signed-out UI)', async () => {
    const payload = await fetchPublicActivityDetail('a1', null);
    expect(api.getPublicActivityMeState).not.toHaveBeenCalled();
    expect(payload.viewerAccess?.gateReason).toBe('sign_in');
    expect(payload.activity.title).toBe('Guest preview');
  });

  it('loads member overlay when viewerUserId is set', async () => {
    const payload = await fetchPublicActivityDetail('a1', 'user-1');
    expect(api.getPublicActivityMeState).toHaveBeenCalledWith('a1');
    expect(payload.activity.title).toBe('Full detail');
  });
});
