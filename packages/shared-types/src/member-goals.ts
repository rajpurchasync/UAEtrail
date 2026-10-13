/**
 * Personal outdoor goals.
 * Join progress = visited pins on My Map (manual logs + trip check-ins) within the goal window.
 * Host progress = published outings you led in the window (no host profile required).
 */

export type MemberGoalActivityFilter = 'hiking' | 'camping' | 'all_outings';

export type MemberGoalCountMode = 'join' | 'host';

/** Max concurrent personal goals per member. */
export const MAX_MEMBER_GOALS = 3;

export interface MemberGoalDTO {
  id: string;
  activityFilter: MemberGoalActivityFilter;
  /** How progress is counted — joining/logging outings vs hosting. */
  countMode: MemberGoalCountMode;
  targetCount: number;
  /** ISO calendar date (YYYY-MM-DD) — achieve the goal by end of this day (UTC). */
  targetDate: string;
  /** @deprecated Derived from targetDate for legacy clients. */
  year: number;
  currentCount: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertMemberGoalInput {
  activityFilter: MemberGoalActivityFilter;
  countMode?: MemberGoalCountMode;
  targetCount: number;
  targetDate?: string;
  /** @deprecated Use targetDate; end-of-year is assumed when omitted. */
  year?: number;
}

/** Shown on public member profiles when the member shares full visibility. */
export interface MemberGoalPublicDTO {
  activityFilter: MemberGoalActivityFilter;
  countMode?: MemberGoalCountMode;
  targetCount: number;
  targetDate: string;
  year: number;
  currentCount: number;
  completed: boolean;
}
