/** Entity kinds that may emit referral / partner outbound clicks (expand later). */
export type ReferralClickEntityKind = 'facility';

export interface ReferralClickRequestDTO {
  entityKind: ReferralClickEntityKind;
  entityId: string;
  /** Destination the user opened (must match stored partner URL for the entity when verified). */
  destinationUrl: string;
  /** Optional analytics hint — default `partner_link`. */
  source?: string;
}
