/** Whether the member may open the publishing console (`GET /me/status` → `publish.canAccessPublishingWorkspace`). */
export const memberCanManageHostedActivities = (
  user: { id?: string } | null | undefined,
  canAccessPublishingWorkspace: boolean
): boolean => Boolean(user && canAccessPublishingWorkspace);
