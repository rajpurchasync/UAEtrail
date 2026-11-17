/**
 * Activity join engagement — Participate read-model (explicit state machine).
 *
 * Facts (`ActivityJoinEngagementSnapshot`) → phase → projections used by map peek,
 * list footers, and activity detail. Mutations stay in
 * `apps/api/src/lib/activity-engagement-store.ts`.
 *
 * Do not fork `if (status === 'pending')` in peek / list / detail.
 * Viewer access `level` is a separate social-exposure machine
 * (`activity-viewer-access.ts`) — project roster-adjacent levels with
 * `activityViewerLevelFromJoinEngagement`; `join_request` is not this phase.
 *
 * Wire `RequestStatus` is lowercase; Mongo/API enums may be SCREAMING — helpers
 * normalize case.
 */

export type ActivityJoinEngagementKind = 'open' | 'pending' | 'confirmed';

export type ActivityJoinInFlightStatus = 'pending' | 'waitlisted';

export type ActivityJoinEngagementPhase =
  | { kind: 'open' }
  | { kind: 'pending'; status: ActivityJoinInFlightStatus }
  | { kind: 'confirmed'; source: 'roster' | 'approved_request' };

export type ActivityJoinRequestEngagementWire = {
  id?: string;
  status: string;
  canWithdraw: boolean;
};

export type ActivityJoinEngagementSnapshot = {
  hasParticipation?: boolean;
  myRequest?: ActivityJoinRequestEngagementWire | null;
};

/** FE `JoinRequestUiState` — projection of {@link ActivityJoinEngagementPhase}. */
export type ActivityJoinRequestUiProjection =
  | { kind: 'open' }
  | { kind: 'pending'; requestId: string; status: ActivityJoinInFlightStatus }
  | { kind: 'confirmed'; requestId: string };

/** Kind-only view (peek overlay, list inference). */
export type ActivityJoinUiKindProjection = {
  kind: ActivityJoinEngagementKind;
  status?: ActivityJoinInFlightStatus;
};

/** In-flight or approved — still a live join relationship (withdraw / chat / viewer). */
export const ACTIVE_JOIN_REQUEST_WIRE_STATUSES = [
  'pending',
  'approved',
  'waitlisted',
] as const;

export type ActiveJoinRequestWireStatus = (typeof ACTIVE_JOIN_REQUEST_WIRE_STATUSES)[number];

const ACTIVE_JOIN_REQUEST_WIRE_STATUS_SET: ReadonlySet<string> = new Set(
  ACTIVE_JOIN_REQUEST_WIRE_STATUSES
);

export const normalizeJoinRequestWireStatus = (status: string): string =>
  status.trim().toLowerCase();

export const isActiveJoinRequestWireStatus = (status: string | null | undefined): boolean => {
  if (!status) return false;
  return ACTIVE_JOIN_REQUEST_WIRE_STATUS_SET.has(normalizeJoinRequestWireStatus(status));
};

export const isInFlightJoinRequestWireStatus = (status: string | null | undefined): boolean => {
  const normalized = status ? normalizeJoinRequestWireStatus(status) : '';
  return normalized === 'pending' || normalized === 'waitlisted';
};

/** Same rule as API `canWithdrawRequest` — pending, approved, or waitlisted. */
export const canWithdrawJoinRequestStatus = (status: string): boolean =>
  isActiveJoinRequestWireStatus(status);

const inFlightStatusFromWire = (status: string): ActivityJoinInFlightStatus =>
  normalizeJoinRequestWireStatus(status) === 'waitlisted' ? 'waitlisted' : 'pending';

/** Canonical phase. Kind is `phase.kind` — do not re-derive it. */
export const resolveActivityJoinEngagementPhase = (
  input: ActivityJoinEngagementSnapshot
): ActivityJoinEngagementPhase => {
  if (input.hasParticipation) return { kind: 'confirmed', source: 'roster' };

  if (!input.myRequest?.canWithdraw) return { kind: 'open' };

  const status = normalizeJoinRequestWireStatus(input.myRequest.status);
  if (status === 'approved') return { kind: 'confirmed', source: 'approved_request' };
  if (status === 'pending' || status === 'waitlisted') {
    return { kind: 'pending', status };
  }

  return { kind: 'open' };
};

/** Wire join state for presentation + tab footers. */
export const resolveActivityJoinEngagementKind = (
  input: ActivityJoinEngagementSnapshot
): ActivityJoinEngagementKind => resolveActivityJoinEngagementPhase(input).kind;

export const projectActivityJoinRequestUiState = (
  input: ActivityJoinEngagementSnapshot
): ActivityJoinRequestUiProjection => {
  const phase = resolveActivityJoinEngagementPhase(input);
  if (phase.kind === 'open') return { kind: 'open' };
  if (phase.kind === 'pending') {
    return {
      kind: 'pending',
      requestId: input.myRequest?.id ?? 'request',
      status: phase.status,
    };
  }
  return {
    kind: 'confirmed',
    requestId: input.myRequest?.id ?? 'participation',
  };
};

/** Peek `pending_join.joinRequestStatus` from a join UI projection. */
export const mapPeekJoinRequestStatusFromUiKind = (
  joinUi?: ActivityJoinUiKindProjection | null
): ActivityJoinInFlightStatus | null => {
  if (joinUi?.kind !== 'pending') return null;
  return joinUi.status === 'waitlisted' ? 'waitlisted' : 'pending';
};

/**
 * Peek join-request status from snapshot facts (when wire did not already set it).
 * Approved is confirmed, not an in-flight peek status.
 */
export const mapPeekJoinRequestStatusFromSnapshot = (
  input: ActivityJoinEngagementSnapshot
): ActivityJoinInFlightStatus | null => {
  const phase = resolveActivityJoinEngagementPhase(input);
  return phase.kind === 'pending' ? phase.status : null;
};

export const mapPeekJoinRequestStatusFromWire = (
  status: string | null | undefined
): ActivityJoinInFlightStatus | null => {
  if (!status || !isInFlightJoinRequestWireStatus(status)) return null;
  return inFlightStatusFromWire(status);
};
