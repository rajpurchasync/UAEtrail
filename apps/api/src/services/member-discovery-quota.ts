import {
  MEMBER_DISCOVERY_WINDOW_DAYS,
  buildMemberDiscoveryQuota,
  memberHasUnlimitedDiscovery,
  type MemberDiscoveryQuotaDTO,
} from '@uaetrail/shared-types';
import type { HostStatusDTO } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import {
  countMemberDiscoveryProfilesOpenedSince,
  hasMemberDiscoveryOpenInWindow,
  recordMemberProfileView,
} from '../lib/member-profile-views-store.js';

const windowStart = (): Date =>
  new Date(Date.now() - MEMBER_DISCOVERY_WINDOW_DAYS * 86_400_000);

export const resolveMemberDiscoveryQuota = async (
  viewerUserId: string,
  hostStatus: HostStatusDTO | null
): Promise<MemberDiscoveryQuotaDTO> => {
  const unlimited = memberHasUnlimitedDiscovery(hostStatus);
  const used = await countMemberDiscoveryProfilesOpenedSince(viewerUserId, windowStart());
  return buildMemberDiscoveryQuota(used, unlimited);
};

/**
 * Gate + record a Discover-surface profile open (3 unique profiles / 30d for free members).
 */
export const assertAndRecordMemberDiscoveryProfileOpen = async (input: {
  viewerUserId: string;
  profileUserId: string;
  hostStatus: HostStatusDTO | null;
}): Promise<void> => {
  if (input.viewerUserId === input.profileUserId) return;

  const since = windowStart();
  const unlimited = memberHasUnlimitedDiscovery(input.hostStatus);

  if (!unlimited) {
    const alreadyOpen = await hasMemberDiscoveryOpenInWindow(
      input.viewerUserId,
      input.profileUserId,
      since
    );
    if (!alreadyOpen) {
      const used = await countMemberDiscoveryProfilesOpenedSince(input.viewerUserId, since);
      const quota = buildMemberDiscoveryQuota(used, false);
      if (quota.remaining === 0) {
        throw new ApiError(
          403,
          'upgrade_required',
          'You have reached your member discovery limit. Upgrade to Pro to keep meeting people.'
        );
      }
    }
  }

  await recordMemberProfileView({
    profileUserId: input.profileUserId,
    viewerUserId: input.viewerUserId,
    source: 'discover',
  });
};
