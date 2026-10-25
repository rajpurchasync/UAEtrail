/** Host-facing participant roster (confirmed joiners on an activity). */

export type HostParticipantRosterStatus = 'going' | 'attended';

import type { RideshareRiderRatingDimensionsDTO } from './rideshare-rider-reputation.js';

export interface ParticipantHostRatingDTO {
  score: number;
  comment?: string | null;
  ratedAt: string;
  rideshare?: RideshareRiderRatingDimensionsDTO | null;
}
