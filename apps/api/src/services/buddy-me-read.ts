import {
  getBuddyRelationship,
  listBuddyRequestsForUser,
  listBuddiesForUser,
} from '../lib/buddy-store.js';
import { loadBuddyActivityPresence } from './buddy-activity-presence.js';

export const listMyBuddies = (userId: string) => listBuddiesForUser(userId);

export const listMyBuddyRequests = (
  userId: string,
  direction: 'incoming' | 'outgoing' | 'all'
) => listBuddyRequestsForUser(userId, direction);

export const loadMyBuddyRelationship = (viewerUserId: string, targetUserId: string) =>
  getBuddyRelationship(viewerUserId, targetUserId);

export const loadMyBuddiesActivityPresence = (input: {
  viewerUserId: string;
  userRole: string;
  datePresetRaw?: string;
}) =>
  loadBuddyActivityPresence({
    viewerUserId: input.viewerUserId,
    userRole: input.userRole,
    datePresetRaw: input.datePresetRaw,
  });
