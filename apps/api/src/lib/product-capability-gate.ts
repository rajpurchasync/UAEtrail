import type { MemberStatusDTO } from '@uaetrail/shared-types';

/** Product publish gates — use MemberStatusDTO only (not UserRole / isHostRole). */
export const canPublishFromMemberStatus = (status: MemberStatusDTO | null | undefined): boolean =>
  Boolean(status?.publish?.canPublish);

export const canAccessPublishingWorkspaceFromMemberStatus = (
  status: MemberStatusDTO | null | undefined
): boolean => Boolean(status?.publish?.canAccessPublishingWorkspace);
