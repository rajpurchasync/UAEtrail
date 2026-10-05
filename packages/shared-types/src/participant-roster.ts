/** Host-facing participant roster (confirmed joiners on an activity). */

export type HostParticipantRosterStatus = 'going' | 'attended';

export interface ParticipantHostRatingDTO {
  score: number;
  comment?: string | null;
  ratedAt: string;
}
