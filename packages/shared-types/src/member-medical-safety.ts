/** Outing safety — blood group, conditions, emergency contact (host-visible after join/request). */

export const BLOOD_GROUP_VALUES = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
] as const;

export type BloodGroup = (typeof BLOOD_GROUP_VALUES)[number];

/** Wire value when member has no conditions to declare. */
export const MEDICAL_CONDITIONS_NA = 'N/A';

export type MemberMedicalSafetyFields = {
  bloodGroup?: BloodGroup | null;
  medicalConditions?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
};

export type MemberMedicalSafetyDTO = {
  bloodGroup: BloodGroup;
  medicalConditions: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

export const isMedicalSafetyProfileComplete = (
  profile: MemberMedicalSafetyFields | null | undefined
): boolean => {
  const blood = profile?.bloodGroup?.trim();
  if (!blood || !BLOOD_GROUP_VALUES.includes(blood as BloodGroup)) return false;
  const conditions = profile?.medicalConditions?.trim();
  if (!conditions) return false;
  const name = profile?.emergencyContactName?.trim();
  if (!name || name.length < 2) return false;
  const phone = profile?.emergencyContactPhone?.trim();
  if (!phone || phone.length < 8) return false;
  return true;
};

export const toMemberMedicalSafetyDto = (
  profile: MemberMedicalSafetyFields | null | undefined
): MemberMedicalSafetyDTO | null => {
  if (!isMedicalSafetyProfileComplete(profile)) return null;
  return {
    bloodGroup: profile!.bloodGroup as BloodGroup,
    medicalConditions: profile!.medicalConditions!.trim(),
    emergencyContactName: profile!.emergencyContactName!.trim(),
    emergencyContactPhone: profile!.emergencyContactPhone!.trim(),
  };
};

export const formatBloodGroupLabel = (value: BloodGroup): string => value;
