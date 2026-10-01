import { isHostRole } from './roles';

/** Whether the member may see hosted-activity management (org publish gate, not UI route name). */
export const memberCanManageHostedActivities = (
  user: { role?: string | null } | null | undefined,
  canPublish: boolean
): boolean => Boolean(user && (isHostRole(user.role) || canPublish));
