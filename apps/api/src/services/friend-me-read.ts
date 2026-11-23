import {
  getFriendRelationship,
  listFriendRequestsForUser,
  listFriendsForUser,
} from '../lib/friend-store.js';
import { loadFriendActivityPresence } from './friend-activity-presence.js';

export const listMyFriends = (userId: string) => listFriendsForUser(userId);

export const listMyFriendRequests = (
  userId: string,
  direction: 'incoming' | 'outgoing' | 'all'
) => listFriendRequestsForUser(userId, direction);

export const loadMyFriendRelationship = (viewerUserId: string, targetUserId: string) =>
  getFriendRelationship(viewerUserId, targetUserId);

export const loadMyFriendsActivityPresence = (input: {
  viewerUserId: string;
  userRole: string;
  datePresetRaw?: string;
}) =>
  loadFriendActivityPresence({
    viewerUserId: input.viewerUserId,
    userRole: input.userRole,
    datePresetRaw: input.datePresetRaw,
  });
