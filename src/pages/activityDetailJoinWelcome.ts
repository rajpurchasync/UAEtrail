export type ActivityDetailJoinWelcomeUi =
  | { kind: 'closed' }
  | { kind: 'open' };

export const ACTIVITY_DETAIL_JOIN_WELCOME_CLOSED: ActivityDetailJoinWelcomeUi = { kind: 'closed' };

export const activityDetailJoinWelcomeShouldOpen = (input: {
  joinedWelcomeQuery: boolean;
  detailLoading: boolean;
  hasActivity: boolean;
  isConfirmedParticipant: boolean;
  canAccessCrewSurfaces: boolean | null | undefined;
  alreadyHandled: boolean;
}): boolean =>
  input.joinedWelcomeQuery &&
  !input.detailLoading &&
  input.hasActivity &&
  input.isConfirmedParticipant &&
  !input.alreadyHandled &&
  input.canAccessCrewSurfaces !== false;