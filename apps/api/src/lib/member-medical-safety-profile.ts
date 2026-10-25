import {
  toMemberMedicalSafetyDto,
  type MemberMedicalSafetyFields,
} from '@uaetrail/shared-types';
import type { AuthUserRecord } from './auth-users-store.js';

export type ProfileMedicalSlice = Pick<
  AuthUserRecord['profile'],
  | 'bloodGroup'
  | 'medicalConditions'
  | 'emergencyContactName'
  | 'emergencyContactPhone'
>;

export const medicalSafetyFieldsFromAuthProfile = (
  profile: MemberMedicalSafetyFields | AuthUserRecord['profile'] | null | undefined
): MemberMedicalSafetyFields => ({
  bloodGroup: profile?.bloodGroup ?? null,
  medicalConditions: profile?.medicalConditions ?? null,
  emergencyContactName: profile?.emergencyContactName ?? null,
  emergencyContactPhone: profile?.emergencyContactPhone ?? null,
});

export const hostVisibleMedicalSafety = (
  profile: MemberMedicalSafetyFields | AuthUserRecord['profile'] | null | undefined
) => toMemberMedicalSafetyDto(medicalSafetyFieldsFromAuthProfile(profile));

export const assertMemberMedicalSafetyForJoin = async (userId: string): Promise<void> => {
  const { findAuthUserById } = await import('./auth-users-store.js');
  const { assertMedicalSafetyProfileComplete } = await import('../domain/member-medical-safety.js');
  const user = await findAuthUserById(userId);
  assertMedicalSafetyProfileComplete(medicalSafetyFieldsFromAuthProfile(user?.profile));
};
