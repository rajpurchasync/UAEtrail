import type { RideshareVehiclePublicDTO } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { findMemberVehicleForUser, toRideshareVehiclePublic } from '../lib/member-vehicles-store.js';

export const resolveRideshareVehicleForActivityPublish = async (
  actorId: string,
  vehicleId: string | undefined | null
): Promise<{ rideshareVehicleId: string; rideshareVehicle: RideshareVehiclePublicDTO }> => {
  const trimmed = vehicleId?.trim();
  if (!trimmed) {
    throw new ApiError(400, 'rideshare_vehicle_required', 'Select a car for this ride.');
  }
  const vehicle = await findMemberVehicleForUser(actorId, trimmed);
  if (!vehicle) {
    throw new ApiError(400, 'rideshare_vehicle_not_found', 'Select one of your saved cars.');
  }
  return {
    rideshareVehicleId: vehicle.id,
    rideshareVehicle: toRideshareVehiclePublic(vehicle),
  };
};
