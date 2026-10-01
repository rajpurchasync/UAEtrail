/** Personal outing goals. Progress = host check-ins between goal start and target date. */

export type MemberGoalActivityFilter = 'hiking' | 'camping' | 'all_outings';

export interface MemberGoalDTO {
  id: string;
  activityFilter: MemberGoalActivityFilter;
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
  targetCount: number;
  targetDate?: string;
  /** @deprecated Use targetDate; end-of-year is assumed when omitted. */
  year?: number;
}

/** Shown on public member profiles when the member shares full visibility. */
export interface MemberGoalPublicDTO {
  activityFilter: MemberGoalActivityFilter;
  targetCount: number;
  targetDate: string;
  year: number;
  currentCount: number;
  completed: boolean;
}
