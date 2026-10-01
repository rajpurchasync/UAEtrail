/** Personal journey map pins — wishlist, visited (manual or from app check-in). */

import type { MemberMapPinActivityType } from './member-map-pin-activity-type.js';
import type { OutdoorMapEntryDTO } from './outdoor-map-entries.js';

export type MemberMapPinKind = 'wishlist' | 'visited';

export type MemberMapPinSource = 'manual' | 'activity_check_in';

export interface MemberMapPinDTO {
  id: string;
  kind: MemberMapPinKind;
  source: MemberMapPinSource;
  title: string;
  /** Calendar date for the pin (YYYY-MM-DD) — visit date or hoped-for date. */
  placeDate: string;
  latitude: number;
  longitude: number;
  activityId: string | null;
  locationId: string | null;
  notes: string | null;
  activityType: MemberMapPinActivityType | string | null;
  activityPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberMapPinInput {
  kind: MemberMapPinKind;
  latitude: number;
  longitude: number;
  title?: string;
  placeDate?: string;
  notes?: string | null;
  activityType?: MemberMapPinActivityType;
}

export interface UpdateMemberMapPinInput {
  title?: string;
  placeDate?: string;
  notes?: string | null;
  kind?: MemberMapPinKind;
  activityType?: MemberMapPinActivityType | null;
}

export interface MemberJourneyMapStatsDTO {
  totalPins: number;
  wishlistCount: number;
  visitedCount: number;
  activityCheckInCount: number;
  byActivityType: Partial<Record<MemberMapPinActivityType, number>>;
}

export interface MemberJourneyMapDTO {
  pins: MemberMapPinDTO[];
  entries: OutdoorMapEntryDTO[];
  stats: MemberJourneyMapStatsDTO;
}
