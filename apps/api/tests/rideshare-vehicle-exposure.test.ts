import { describe, expect, it } from 'vitest';
import {
  enrichActivityRideshareVehicleForCrew,
  sanitizeRideshareVehiclePublic,
  stripRideshareVehicleFromActivityDto,
} from '../src/lib/rideshare-vehicle-crew.js';
import type { ActivityDTO } from '@uaetrail/shared-types';

describe('rideshare vehicle exposure', () => {
  it('strips plate from sanitized public vehicle snapshots', () => {
    expect(
      sanitizeRideshareVehiclePublic({
        id: 'v1',
        make: 'Toyota',
        model: 'Fortuner',
        color: 'white',
        year: 2022,
        plateNumber: 'A 12345',
      })
    ).toEqual({
      id: 'v1',
      make: 'Toyota',
      model: 'Fortuner',
      color: 'white',
      year: 2022,
    });
  });

  it('removes rideshare vehicle fields from member profile activity rows', () => {
    const dto = {
      id: 'act-1',
      rideshareVehicleId: 'v1',
      rideshareVehicle: {
        id: 'v1',
        make: 'Toyota',
        model: 'Fortuner',
        color: 'white',
        year: 2022,
      },
    } as ActivityDTO;

    expect(stripRideshareVehicleFromActivityDto(dto)).toMatchObject({
      id: 'act-1',
      rideshareVehicleId: null,
      rideshareVehicle: null,
    });
  });

  it('does not attach plate without crew access', async () => {
    const dto = {
      id: 'act-1',
      rideshareVehicleId: 'v1',
      rideshareVehicle: {
        id: 'v1',
        make: 'Toyota',
        model: 'Fortuner',
        color: 'white',
        year: 2022,
      },
    } as ActivityDTO;

    const result = await enrichActivityRideshareVehicleForCrew(dto, 'host-user', false);
    expect(result.rideshareVehicle?.plateNumber).toBeUndefined();
  });
});
