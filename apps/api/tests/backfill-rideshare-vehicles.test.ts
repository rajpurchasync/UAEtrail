import { describe, expect, it } from 'vitest';
import { buildRandomMemberVehicleInput } from '../src/lib/backfill-rideshare-vehicles.js';
import { MEMBER_VEHICLE_COLORS } from '@uaetrail/shared-types';

describe('buildRandomMemberVehicleInput', () => {
  it('returns stable vehicle fields for the same owner seed', () => {
    const a = buildRandomMemberVehicleInput('user-abc');
    const b = buildRandomMemberVehicleInput('user-abc');
    expect(a).toEqual(b);
  });

  it('returns valid garage input shape', () => {
    const input = buildRandomMemberVehicleInput('user-xyz');
    expect(input.make.length).toBeGreaterThan(0);
    expect(input.model.length).toBeGreaterThan(0);
    expect(MEMBER_VEHICLE_COLORS).toContain(input.color);
    expect(input.year).toBeGreaterThanOrEqual(new Date().getFullYear() - 8);
    expect(input.plateNumber.length).toBeGreaterThanOrEqual(2);
  });
});
