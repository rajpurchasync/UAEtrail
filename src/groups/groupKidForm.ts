import type { FamilyKidGender, SocialGroupMemberView } from '../api/types';

export const KID_EMERGENCY_ME_RELATION = 'Me';

export const KID_EMERGENCY_RELATION_OPTIONS = [
  { value: 'Parent', label: 'Parent' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Father', label: 'Father' },
  { value: 'Guardian', label: 'Guardian' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Other', label: 'Other' },
] as const;

export type KidFormState = {
  displayName: string;
  dateOfBirth: string;
  emergencyContactIsMe: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  medicalConditions: string;
  gender: FamilyKidGender | '';
  photoUrl: string;
};

export const emptyKidForm: KidFormState = {
  displayName: '',
  dateOfBirth: '',
  emergencyContactIsMe: true,
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: KID_EMERGENCY_ME_RELATION,
  medicalConditions: '',
  gender: '',
  photoUrl: '',
};

const normalizePhoneKey = (value: string | null | undefined): string =>
  (value ?? '').replace(/\D/g, '');

const toDateInputValue = (value: string | null | undefined): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export const kidFormFromMember = (
  member: SocialGroupMemberView,
  me?: { name: string; phone: string }
): KidFormState => {
  const relation = (member.emergencyContactRelation ?? '').trim();
  const phone = member.emergencyContactPhone ?? '';
  const isMe =
    relation.toLowerCase() === 'me' ||
    (Boolean(me?.phone) &&
      normalizePhoneKey(phone) === normalizePhoneKey(me?.phone) &&
      Boolean(me?.name) &&
      (member.emergencyContactName ?? '').trim().toLowerCase() === (me?.name ?? '').trim().toLowerCase());
  return {
    displayName: member.displayName ?? '',
    dateOfBirth: toDateInputValue(member.dateOfBirth),
    emergencyContactIsMe: isMe,
    emergencyContactName: member.emergencyContactName ?? '',
    emergencyContactPhone: phone,
    emergencyContactRelation: isMe ? KID_EMERGENCY_ME_RELATION : relation || 'Parent',
    medicalConditions: member.medicalConditions ?? '',
    gender: (member.gender ?? '') as FamilyKidGender | '',
    photoUrl: member.photoUrl ?? '',
  };
};

export type ResolvedKidEmergency = {
  name: string;
  phone: string;
  relation: string;
};

export const resolveKidEmergencyFromForm = (
  kidForm: KidFormState,
  meEmergency: { name: string; phone: string }
): ResolvedKidEmergency => {
  if (kidForm.emergencyContactIsMe) {
    return {
      name: meEmergency.name,
      phone: meEmergency.phone,
      relation: KID_EMERGENCY_ME_RELATION,
    };
  }
  return {
    name: kidForm.emergencyContactName.trim(),
    phone: kidForm.emergencyContactPhone.trim(),
    relation: kidForm.emergencyContactRelation.trim(),
  };
};

export const isKidTripFormReady = (
  kidForm: KidFormState,
  emergency: ResolvedKidEmergency
): boolean =>
  kidForm.displayName.trim().length >= 2 &&
  Boolean(kidForm.dateOfBirth) &&
  emergency.name.length >= 2 &&
  emergency.phone.length >= 8 &&
  emergency.relation.length >= 1 &&
  kidForm.medicalConditions.trim().length >= 1;

export const kidFullProfilePayload = (
  kidForm: KidFormState,
  emergency: ResolvedKidEmergency
) => ({
  displayName: kidForm.displayName,
  dateOfBirth: kidForm.dateOfBirth,
  emergencyContactName: emergency.name,
  emergencyContactPhone: emergency.phone,
  emergencyContactRelation: emergency.relation,
  medicalConditions: kidForm.medicalConditions,
  gender: kidForm.gender || null,
  photoUrl: kidForm.photoUrl.trim() ? kidForm.photoUrl.trim() : null,
});

export { toDateInputValue };