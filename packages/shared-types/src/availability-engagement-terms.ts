import type { MemberAvailabilitySlotDTO } from './member-availability.js';
import type { AvailabilityEngagementTerms } from './availability-slot.js';

export const defaultGuideEngagementTerms = (): AvailabilityEngagementTerms => ({
  pricingKind: 'free',
});

export const pickGuideEngagementTermsFromSlots = (
  slots: MemberAvailabilitySlotDTO[]
): AvailabilityEngagementTerms | null => {
  for (const slot of slots) {
    if (slot.capacity === 'guide' && slot.engagementTerms) {
      return slot.engagementTerms;
    }
  }
  return null;
};

export const formatEngagementTermsPricingLabel = (
  terms: AvailabilityEngagementTerms | null | undefined
): string | null => {
  if (!terms) return null;
  if (terms.pricingKind === 'free') return 'Free';
  if (terms.pricingKind === 'upon_request') return 'Price on request';
  if (terms.pricingKind === 'paid') {
    if (terms.rate != null && Number.isFinite(terms.rate) && terms.rate > 0) {
      return `From AED ${Math.round(terms.rate)}`;
    }
    return 'Paid';
  }
  return null;
};

const tourShapeLabel = (shape: AvailabilityEngagementTerms['tourShape']): string | null => {
  if (shape === 'private') return 'Private';
  if (shape === 'group') return 'Group trips';
  if (shape === 'either') return 'Private or group';
  return null;
};

/** Browse / card chip line — pricing · tour shape · group size (MIG-SG-C1). */
export const formatGuideEngagementTermsBrowseLine = (
  terms: AvailabilityEngagementTerms | null | undefined
): string | null => {
  if (!terms) return null;
  const parts: string[] = [];
  const price = formatEngagementTermsPricingLabel(terms);
  if (price) parts.push(price);
  const shape = tourShapeLabel(terms.tourShape);
  if (shape) parts.push(shape);
  if (terms.minParticipants != null && terms.minParticipants > 1) {
    parts.push(`Min ${terms.minParticipants}`);
  }
  if (terms.maxParticipants != null) {
    parts.push(`Up to ${terms.maxParticipants}`);
  }
  return parts.length ? parts.join(' · ') : null;
};

export const guideEngagementTermsBrowseLineFromSlots = (
  slots: MemberAvailabilitySlotDTO[]
): string | null => formatGuideEngagementTermsBrowseLine(pickGuideEngagementTermsFromSlots(slots));