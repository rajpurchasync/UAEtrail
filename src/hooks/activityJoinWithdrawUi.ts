export type ActivityJoinWithdrawUi =
  | { kind: 'hidden' }
  | { kind: 'confirm' }
  | { kind: 'withdrawing' };

export const ACTIVITY_JOIN_WITHDRAW_HIDDEN: ActivityJoinWithdrawUi = { kind: 'hidden' };

export const activityJoinWithdrawIsVisible = (ui: ActivityJoinWithdrawUi): boolean =>
  ui.kind !== 'hidden';

export const activityJoinWithdrawIsBusy = (ui: ActivityJoinWithdrawUi): boolean =>
  ui.kind === 'withdrawing';