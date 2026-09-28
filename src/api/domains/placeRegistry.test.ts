import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fetchPlaceRegistry } from './placeRegistry';
import { apiRequest } from '../client';

vi.mock('../client', () => ({
  apiRequest: vi.fn(),
}));

const mockRequest = vi.mocked(apiRequest);

describe('fetchPlaceRegistry', () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  it('calls GET /places/registry with activityType filter', async () => {
    mockRequest.mockResolvedValueOnce({ data: [] });

    await fetchPlaceRegistry({ placeType: 'hiking' });

    expect(mockRequest).toHaveBeenCalledWith('/places/registry?activityType=hiking', { auth: true });
  });
});
