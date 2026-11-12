import { z } from 'zod';
import {
  BLOOD_GROUP_VALUES,
  MEDICAL_CONDITIONS_NA,
  isMedicalSafetyProfileComplete,
  type MemberMedicalSafetyFields,
} from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { isValidE164Phone } from '../lib/phone.js';

export const updateMedicalSafetyProfileSchema = z.object({
  bloodGroup: z.enum(BLOOD_GROUP_VALUES),
  medicalConditions: z
    .string()
    .trim()
    .min(1, 'Add medical conditions or select N/A.')
    .max(500),
  emergencyContactName: z.string().trim().min(2).max(80),
  emergencyContactPhone: z.string().trim().min(8).max(30),
  emergencyContactRelation: z.string().trim().min(1).max(40),
});

export type UpdateMedicalSafetyProfileInput = z.infer<typeof updateMedicalSafetyProfileSchema>;

export const assertMedicalSafetyProfileComplete = (
  profile: MemberMedicalSafetyFields | null | undefined
): void => {
  if (isMedicalSafetyProfileComplete(profile)) return;
  throw new ApiError(
    400,
    'medical_safety_profile_required',
    'Add your blood group, medical conditions (or N/A), and emergency contact (name, relation, phone) in Profile → Settings → Safety before joining an outing.'
  );
};

export const validateMedicalSafetyPhone = (phone: string): void => {
  if (!isValidE164Phone(phone)) {
    throw new ApiError(400, 'invalid_emergency_phone', 'Enter a valid emergency contact phone (E.164, e.g. +971501234567).');
  }
};

export const normalizeMedicalConditions = (value: string): string => {
  const trimmed = value.trim();
  if (/^n\/?a$/i.test(trimmed)) return MEDICAL_CONDITIONS_NA;
  return trimmed;
};
