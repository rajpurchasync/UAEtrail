import { MEMBER_MAP_PIN_ACTIVITY_TYPES } from '@uaetrail/shared-types';
import {
  createManualMemberMapPin,
  deleteMemberMapPin,
  updateMemberMapPin,
} from '../lib/member-map-pins-store.js';

type MapPinActivityType = (typeof MEMBER_MAP_PIN_ACTIVITY_TYPES)[number];

export const createMyMapPin = (
  userId: string,
  body: {
    kind: 'wishlist' | 'visited';
    latitude: number;
    longitude: number;
    title?: string;
    placeDate?: string;
    notes?: string | null;
    activityType?: MapPinActivityType;
  }
) => createManualMemberMapPin(userId, body);

export const updateMyMapPin = (
  userId: string,
  pinId: string,
  body: {
    title?: string;
    placeDate?: string;
    notes?: string | null;
    kind?: 'wishlist' | 'visited';
    activityType?: MapPinActivityType | null;
  }
) => updateMemberMapPin(userId, pinId, body);

export const deleteMyMapPin = (userId: string, pinId: string) =>
  deleteMemberMapPin(userId, pinId);
