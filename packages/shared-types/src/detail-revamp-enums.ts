/** Plan §13.8 host / verification / facility enums + array caps. */

export type HostType = 'community' | 'tour_operator' | 'pro_guide';

export type VerificationStatus =
  | 'none'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'expired'
  | 'pending_migration';

export type VerificationState = {
  status: VerificationStatus;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  verifiedUntil?: string | null;
  rejectionReason?: string | null;
};

export type FacilityType =
  | 'water_station'
  | 'fountain'
  | 'pond'
  | 'rest_area'
  | 'toilet'
  | 'parking'
  | 'cafe'
  | 'gas_station'
  | 'gear_rental'
  | 'shop';

export const AMENITY_TYPES: FacilityType[] = [
  'water_station',
  'fountain',
  'pond',
  'rest_area',
  'toilet',
  'parking',
];

export const COMMERCIAL_FACILITY_TYPES: FacilityType[] = [
  'cafe',
  'gas_station',
  'gear_rental',
  'shop',
];

export const DETAIL_ARRAY_CAPS = {
  gear: 30,
  itinerary: 20,
  galleryActivity: 8,
  galleryPlace: 12,
  goingPreview: 8,
  nearby: 10,
  attachedTo: 5,
  guides: 5,
  includesExcludes: 12,
  activeAlerts: 3,
} as const;

export type CatalogKind = 'gear' | 'amenity' | 'hazard' | 'cancellation_policy';

export type CatalogEntryDoc = {
  _id: string;
  kind: CatalogKind;
  key: string;
  labelEn: string;
  labelAr?: string;
  iconKey?: string;
  freeCancelHours?: number;
  refundPctAfter?: number;
  hostCancelText?: string;
};

export type VerificationDocumentType =
  | 'emirates_id'
  | 'passport'
  | 'trade_licence'
  | 'tourism_permit'
  | 'insurance'
  | 'first_aid'
  | 'guide_certification'
  | 'other';

export type VerificationDocumentDoc = {
  _id: string;
  organizerId: string;
  docType: VerificationDocumentType;
  fileKey: string;
  status: 'pending' | 'accepted' | 'rejected';
  expiresAt?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
};

/** Reserved empty collection — in-app activity payments (plan §13.8). */
export type PaymentDoc = {
  _id: string;
  activityId: string;
  participationId: string;
  userId: string;
  payeeOrganizerId: string;
  amountFils: number;
  currency: 'AED';
  feeFils?: number;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'partially_refunded' | 'failed';
  provider: string;
  providerRef: string;
  createdAt: string;
  updatedAt: string;
};

export const mapFacilityKindToPlanType = (kind: string): FacilityType | null => {
  switch (kind) {
    case 'toilet':
      return 'toilet';
    case 'parking':
      return 'parking';
    case 'water_refill':
      return 'water_station';
    case 'rest_area':
    case 'picnic':
      return 'rest_area';
    case 'gas_station':
      return 'gas_station';
    case 'shop':
    case 'outdoor_shop':
    case 'grocery':
      return 'shop';
    case 'food':
      return 'cafe';
    default:
      return null;
  }
};
