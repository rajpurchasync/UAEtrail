import { ApiError } from '../lib/api-error.js';
import { findCommunityById } from '../lib/community-groups-store.js';
import { isCommunityAdministrator } from './community-host-access.js';

/** Host may only tag published outings with communities they administrate (`MIG-COMMUNITY-DISCOVER`). */
export const assertDiscoverCommunityIdForActivityPublish = async (
  hostUserId: string,
  discoverCommunityId: string | null | undefined,
  joinMode: 'open' | 'private' | null | undefined
): Promise<void> => {
  const id = discoverCommunityId?.trim();
  if (!id) return;

  if (joinMode === 'private') {
    throw new ApiError(
      400,
      'community_not_on_private_outing',
      'Private outings cannot be linked to a discoverable community.'
    );
  }

  const community = await findCommunityById(id);
  if (!community || community.status !== 'active' || community.visibility !== 'public') {
    throw new ApiError(404, 'community_not_found', 'Community not found.');
  }
  const allowed = await isCommunityAdministrator(community.id, hostUserId);
  if (!allowed) {
    throw new ApiError(403, 'community_host_required', 'Only the community host can tag outings for this community.');
  }
};