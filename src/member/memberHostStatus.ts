import type { HostStatusDTO } from '@uaetrail/shared-types';

/** Host console tile / hosted activities — prefer API flag over `UserRole`. */
export const memberCanAccessHostConsole = (
  status: HostStatusDTO | null | undefined,
  fallbackCanPublish = false
): boolean => Boolean(status?.canAccessHostConsole ?? fallbackCanPublish);

export const memberCanPublishOrganize = (status: HostStatusDTO | null | undefined): boolean =>
  Boolean(status?.canPublish);
