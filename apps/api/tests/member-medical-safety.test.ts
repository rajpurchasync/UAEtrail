import { describe, expect, it } from 'vitest';
import {
  BLOOD_GROUP_VALUES,
  MEDICAL_CONDITIONS_NA,
  isMedicalSafetyProfileComplete,
  toMemberMedicalSafetyDto,
} from '@uaetrail/shared-types';
import { normalizeMedicalConditions } from '../src/domain/member-medical-safety.js';

describe('member medical safety', () => {
  it('requires blood group, conditions, and emergency contact', () => {
    expect(isMedicalSafetyProfileComplete(null)).toBe(false);
    expect(
      isMedicalSafetyProfileComplete({
        bloodGroup: 'O+',
        medicalConditions: MEDICAL_CONDITIONS_NA,
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '+971501234567',
      })
    ).toBe(true);
  });

  it('normalizes n/a conditions', () => {
    expect(normalizeMedicalConditions('n/a')).toBe(MEDICAL_CONDITIONS_NA);
  });

  it('maps host-visible dto', () => {
    const dto = toMemberMedicalSafetyDto({
      bloodGroup: BLOOD_GROUP_VALUES[0],
      medicalConditions: MEDICAL_CONDITIONS_NA,
      emergencyContactName: 'Ali',
      emergencyContactPhone: '+971501234567',
    });
    expect(dto?.bloodGroup).toBe(BLOOD_GROUP_VALUES[0]);
  });
});
