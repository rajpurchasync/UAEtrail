import type { UpsertMemberVehicleInput } from '@uaetrail/shared-types';
import {
  createMemberVehicle,
  deleteMemberVehicle,
  updateMemberVehicle,
} from '../lib/member-vehicles-store.js';

export const createMyMemberVehicle = (userId: string, input: UpsertMemberVehicleInput) =>
  createMemberVehicle(userId, input);

export const updateMyMemberVehicle = (
  userId: string,
  vehicleId: string,
  input: UpsertMemberVehicleInput
) => updateMemberVehicle(userId, vehicleId, input);

export const deleteMyMemberVehicle = (userId: string, vehicleId: string) =>
  deleteMemberVehicle(userId, vehicleId);
