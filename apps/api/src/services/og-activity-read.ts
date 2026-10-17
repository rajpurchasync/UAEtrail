import { findPublishedActivityWithPreviewsById } from '../lib/activities-store.js';

export const getPublishedActivityWithPreviewsForOg = (activityId: string) =>
  findPublishedActivityWithPreviewsById(activityId);
