/** Whether the member may open the publishing console (`GET /me/status` → `publish.canAccessOperatorWorkspace`). */
export const memberCanManageHostedActivities = (
  user: { id?: string } | null | undefined,
  canAccessOperatorWorkspace: boolean
): boolean => Boolean(user && canAccessOperatorWorkspace);
