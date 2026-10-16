import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fetchPlaceCatalog } from './placeCatalogClient';
import { apiRequest } from '../client';

vi.mock('../client', () => ({
  apiRequest: vi.fn(),
}));

const mockRequest = vi.mocked(apiRequest);

describe('fetchPlaceCatalog', () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  it('calls GET /places/catalog with activityType filter', async () => {
    mockRequest.mockResolvedValueOnce({ data: [] });

    await fetchPlaceCatalog({ placeType: 'hiking' });

    expect(mockRequest).toHaveBeenCalledWith('/places/catalog?activityType=hiking', { auth: true });
  });
});
