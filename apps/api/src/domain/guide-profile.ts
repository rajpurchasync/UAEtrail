import { z } from 'zod';
import { profileLanguagesSchema } from './user-profile.js';

export const guideExperienceSchema = z.string().trim().min(3).max(500);

export const completeGuideProfileSchema = z.object({
  bio: z.string().trim().min(1).max(400),
  languages: profileLanguagesSchema,
  guideExperience: guideExperienceSchema,
});