import { getMemberAvailability } from '../lib/member-availability-store.js';
import { buildMemberAvailabilityMatchPreview } from './member-availability-match-preview.js';

export const loadMyMemberAvailability = (userId: string) => getMemberAvailability(userId);

export const loadMyMemberAvailabilityMatchPreview = (userId: string) =>
  buildMemberAvailabilityMatchPreview(userId);
