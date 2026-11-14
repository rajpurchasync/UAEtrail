import { z } from 'zod';
import { MEDICAL_CONDITIONS_NA } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { isValidE164Phone } from '../lib/phone.js';
import { mediaUrlSchema } from './location-submit.js';
import { normalizeMedicalConditions, validateMedicalSafetyPhone } from './member-medical-safety.js';

export type KidGender = 'male' | 'female' | 'prefer_not_to_say';

export type FamilyKidProfileFields = {
  displayName?: string | null;
  dateOfBirth?: Date | string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  /** e.g. Me, Parent, Mother, Father, Guardian */
  emergencyContactRelation?: string | null;
  medicalConditions?: string | null;
  gender?: KidGender | null;
  photoUrl?: string | null;
};

const hasText = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.trim().length > 0;

export const isKidProfileComplete = (fields: FamilyKidProfileFields | null | undefined): boolean => {
  if (!fields) return false;
  if (!hasText(fields.displayName) || (fields.displayName?.trim().length ?? 0) < 2) return false;
  if (!fields.dateOfBirth) return false;
  const dob = fields.dateOfBirth instanceof Date ? fields.dateOfBirth : new Date(fields.dateOfBirth);
  if (Number.isNaN(dob.getTime())) return false;
  if (dob.getTime() > Date.now()) return false;
  if (!hasText(fields.emergencyContactName) || (fields.emergencyContactName?.trim().length ?? 0) < 2) {
    return false;
  }
  const emergencyPhone = fields.emergencyContactPhone?.trim() ?? '';
  if (!emergencyPhone || !isValidE164Phone(emergencyPhone)) {
    return false;
  }
  if (!hasText(fields.medicalConditions)) return false;
  return true;
};

export const assertKidProfileComplete = (fields: FamilyKidProfileFields | null | undefined): void => {
  if (isKidProfileComplete(fields)) return;
  throw new ApiError(
    400,
    'kid_profile_incomplete',
    'Finish the kid profile (name, date of birth, emergency contact, medical info) before adding them to an outing.'
  );
};

const kidDobSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => {
    const dob = new Date(value);
    return !Number.isNaN(dob.getTime()) && dob.getTime() <= Date.now();
  }, 'Enter a valid date of birth.');

const kidGenderSchema = z.enum(['male', 'female', 'prefer_not_to_say']);

const kidPhotoUrlSchema = z.union([mediaUrlSchema, z.literal(''), z.null()]);

const kidRelationSchema = z.string().trim().min(1).max(40);

/** Name-only roster row — trip fields completed later via PATCH. */
export const createKidRosterSchema = z.object({
  rosterOnly: z.literal(true),
  displayName: z.string().trim().min(2).max(80),
  role: z.enum(['buddy', 'admin']).optional(),
});

export const createKidSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  dateOfBirth: kidDobSchema,
  emergencyContactName: z.string().trim().min(2).max(80),
  emergencyContactPhone: z.string().trim().min(8).max(30),
  emergencyContactRelation: kidRelationSchema.optional().nullable(),
  medicalConditions: z.string().trim().min(1).max(500),
  gender: kidGenderSchema.optional().nullable(),
  photoUrl: kidPhotoUrlSchema.optional(),
  role: z.enum(['buddy', 'admin']).optional(),
});

export const createKidBodySchema = z.union([createKidRosterSchema, createKidSchema]);

export const patchKidSchema = z
  .object({
    displayName: z.string().trim().min(2).max(80).optional(),
    dateOfBirth: kidDobSchema.optional(),
    emergencyContactName: z.string().trim().min(2).max(80).optional(),
    emergencyContactPhone: z.string().trim().min(8).max(30).optional(),
    emergencyContactRelation: kidRelationSchema.optional().nullable(),
    medicalConditions: z.string().trim().min(1).max(500).optional(),
    gender: kidGenderSchema.optional().nullable(),
    photoUrl: kidPhotoUrlSchema.optional(),
  })
  .refine(
    (body) =>
      body.displayName !== undefined ||
      body.dateOfBirth !== undefined ||
      body.emergencyContactName !== undefined ||
      body.emergencyContactPhone !== undefined ||
      body.emergencyContactRelation !== undefined ||
      body.medicalConditions !== undefined ||
      body.gender !== undefined ||
      body.photoUrl !== undefined,
    { message: 'Provide at least one kid profile field.' }
  );

export type CreateKidInput = z.infer<typeof createKidSchema>;
export type CreateKidRosterInput = z.infer<typeof createKidRosterSchema>;
export type CreateKidBodyInput = z.infer<typeof createKidBodySchema>;
export type PatchKidInput = z.infer<typeof patchKidSchema>;

const normalizePhotoUrl = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const normalizeKidProfileInput = (input: {
  displayName?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string | null;
  medicalConditions?: string;
  gender?: KidGender | null;
  photoUrl?: string | null;
}) => {
  if (input.emergencyContactPhone) {
    validateMedicalSafetyPhone(input.emergencyContactPhone);
  }
  return {
    ...(input.displayName !== undefined ? { displayName: input.displayName.trim() } : {}),
    ...(input.dateOfBirth !== undefined ? { dateOfBirth: new Date(input.dateOfBirth) } : {}),
    ...(input.emergencyContactName !== undefined
      ? { emergencyContactName: input.emergencyContactName.trim() }
      : {}),
    ...(input.emergencyContactPhone !== undefined
      ? { emergencyContactPhone: input.emergencyContactPhone.trim() }
      : {}),
    ...(input.emergencyContactRelation !== undefined
      ? {
          emergencyContactRelation:
            input.emergencyContactRelation === null
              ? null
              : input.emergencyContactRelation.trim() || null,
        }
      : {}),
    ...(input.medicalConditions !== undefined
      ? { medicalConditions: normalizeMedicalConditions(input.medicalConditions) }
      : {}),
    ...(input.gender !== undefined ? { gender: input.gender } : {}),
    ...(input.photoUrl !== undefined ? { photoUrl: normalizePhotoUrl(input.photoUrl) } : {}),
  };
};

export { MEDICAL_CONDITIONS_NA };
