import { buildMemberJourneyMap } from './member-journey-map.js';

export const loadMyJourneyMap = (userId: string) => buildMemberJourneyMap(userId);
