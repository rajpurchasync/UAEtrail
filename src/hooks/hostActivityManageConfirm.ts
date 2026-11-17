import type { ActivityDTO } from '@uaetrail/shared-types';

/** Only one host manage confirm dialog at a time. */
export type HostActivityManageConfirm =
  | { kind: 'none' }
  | { kind: 'cancel'; activity: ActivityDTO }
  | { kind: 'delete'; activity: ActivityDTO }
  | { kind: 'suspend'; activity: ActivityDTO };

export const HOST_ACTIVITY_MANAGE_CONFIRM_NONE: HostActivityManageConfirm = { kind: 'none' };

export const hostActivityManageConfirmActivity = (
  confirm: HostActivityManageConfirm
): ActivityDTO | null => {
  if (confirm.kind === 'none') return null;
  return confirm.activity;
};