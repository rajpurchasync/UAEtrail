import {
  findParticipantIntentJoinRequestForUser,
  listParticipantIntentJoinRequestsForOwner,
} from '../lib/participant-intent-requests-store.js';
import { listParticipantIntentsForUser } from '../lib/participant-intents-store.js';

export const listMyParticipantIntents = (userId: string) => listParticipantIntentsForUser(userId);

export const listMyParticipantIntentJoinRequestsForOwner = (intentId: string, ownerUserId: string) =>
  listParticipantIntentJoinRequestsForOwner(intentId, ownerUserId);

export const findMyParticipantIntentJoinRequest = (intentId: string, userId: string) =>
  findParticipantIntentJoinRequestForUser(intentId, userId);
