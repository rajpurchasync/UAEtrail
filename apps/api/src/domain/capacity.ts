import { ApiError } from '../lib/api-error.js';

export const assertCapacityAvailable = (capacity: number, approvedParticipants: number): void => {
  if (approvedParticipants >= capacity) {
    throw new ApiError(400, 'activity_full', 'Activity capacity has already been reached.');
  }
};
