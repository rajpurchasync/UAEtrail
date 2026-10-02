/** Whether the member may see hosted-activity management — use API `canAccessHostConsole` when available. */
export const memberCanManageHostedActivities = (
  user: { id?: string } | null | undefined,
  canAccessHostConsole: boolean
): boolean => Boolean(user && canAccessHostConsole);
