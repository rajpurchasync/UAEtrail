import type { ActivityDTO, RideshareVehiclePublicDTO } from '@uaetrail/shared-types';
import { findMemberVehicleForUser } from './member-vehicles-store.js';

export const stripRideshareVehicleFromActivityDto = (dto: ActivityDTO): ActivityDTO => ({
  ...dto,
  rideshareVehicleId: null,
  rideshareVehicle: null,
});

export const enrichActivityRideshareVehicleForCrew = async (
  dto: ActivityDTO,
  hostUserId: string | null,
  canAccessCrewSurfaces: boolean
): Promise<ActivityDTO> => {
  if (!canAccessCrewSurfaces || !dto.rideshareVehicle || !dto.rideshareVehicleId) {
    return dto;
  }
  const ownerId = hostUserId ?? dto.createdById ?? dto.hostUserId ?? null;
  if (!ownerId) {
    return dto;
  }
  const vehicle = await findMemberVehicleForUser(ownerId, dto.rideshareVehicleId);
  if (!vehicle) {
    return dto;
  }
  return {
    ...dto,
    rideshareVehicle: {
      ...dto.rideshareVehicle,
      plateNumber: vehicle.plateNumber,
    },
  };
};

/** Defensive strip — stored activity snapshots must never leak plates on public reads. */
export const sanitizeRideshareVehiclePublic = (
  vehicle: RideshareVehiclePublicDTO | null | undefined
): RideshareVehiclePublicDTO | null => {
  if (!vehicle) return null;
  const { plateNumber: _plate, ...publicFields } = vehicle as RideshareVehiclePublicDTO & {
    plateNumber?: string;
  };
  return publicFields;
};
