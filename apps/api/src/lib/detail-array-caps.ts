import { z } from 'zod';
import { DETAIL_ARRAY_CAPS } from '@uaetrail/shared-types';

export const gearArraySchema = z.array(z.unknown()).max(DETAIL_ARRAY_CAPS.gear);
export const itineraryArraySchema = z.array(z.unknown()).max(DETAIL_ARRAY_CAPS.itinerary);
export const galleryActivitySchema = z.array(z.unknown()).max(DETAIL_ARRAY_CAPS.galleryActivity);
export const goingPreviewSchema = z.array(z.unknown()).max(DETAIL_ARRAY_CAPS.goingPreview);
