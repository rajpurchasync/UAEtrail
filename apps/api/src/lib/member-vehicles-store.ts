import { randomUUID } from 'node:crypto';
import type { MemberVehicleColor, MemberVehicleDTO, UpsertMemberVehicleInput } from '@uaetrail/shared-types';
import { MEMBER_VEHICLE_COLORS } from '@uaetrail/shared-types';
import { ApiError } from './api-error.js';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';

const MAX_VEHICLES_PER_USER = 8;

type MongoMemberVehicle = {
  _id: string;
  userId: string;
  make: string;
  model: string;
  color: MemberVehicleColor;
  year: number;
  plateNumber: string;
  createdAt: Date;
  updatedAt: Date;
};

const collection = () => getMongoClient()!.db().collection<MongoMemberVehicle>(COLLECTIONS.MEMBER_VEHICLES);

const toDto = (doc: MongoMemberVehicle): MemberVehicleDTO => ({
  id: doc._id,
  make: doc.make,
  model: doc.model,
  color: doc.color,
  year: doc.year,
  plateNumber: doc.plateNumber,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

const normalizeInput = (input: UpsertMemberVehicleInput) => {
  const make = input.make.trim();
  const model = input.model.trim();
  const plateNumber = input.plateNumber.trim().toUpperCase();
  if (make.length < 1 || make.length > 40) {
    throw new ApiError(400, 'invalid_vehicle_make', 'Enter a valid make.');
  }
  if (model.length < 1 || model.length > 40) {
    throw new ApiError(400, 'invalid_vehicle_model', 'Enter a valid model.');
  }
  if (!MEMBER_VEHICLE_COLORS.includes(input.color)) {
    throw new ApiError(400, 'invalid_vehicle_color', 'Choose a vehicle color.');
  }
  const year = input.year;
  const maxYear = new Date().getFullYear() + 1;
  if (!Number.isInteger(year) || year < 1990 || year > maxYear) {
    throw new ApiError(400, 'invalid_vehicle_year', `Enter a year between 1990 and ${maxYear}.`);
  }
  if (plateNumber.length < 2 || plateNumber.length > 15) {
    throw new ApiError(400, 'invalid_plate', 'Enter a valid number plate.');
  }
  return { make, model, color: input.color, year, plateNumber };
};

export const listMemberVehicles = async (userId: string): Promise<MemberVehicleDTO[]> => {
  const rows = await collection().find({ userId }).sort({ updatedAt: -1 }).toArray();
  return rows.map(toDto);
};

export const findMemberVehicleForUser = async (
  userId: string,
  vehicleId: string
): Promise<MemberVehicleDTO | null> => {
  const doc = await collection().findOne({ _id: vehicleId, userId });
  return doc ? toDto(doc) : null;
};

export const createMemberVehicle = async (
  userId: string,
  input: UpsertMemberVehicleInput
): Promise<MemberVehicleDTO> => {
  const count = await collection().countDocuments({ userId });
  if (count >= MAX_VEHICLES_PER_USER) {
    throw new ApiError(400, 'vehicle_limit', 'Remove a car before adding another.');
  }
  const normalized = normalizeInput(input);
  const now = new Date();
  const doc: MongoMemberVehicle = {
    _id: randomUUID(),
    userId,
    ...normalized,
    createdAt: now,
    updatedAt: now,
  };
  await collection().insertOne(doc);
  return toDto(doc);
};

export const updateMemberVehicle = async (
  userId: string,
  vehicleId: string,
  input: UpsertMemberVehicleInput
): Promise<MemberVehicleDTO> => {
  const normalized = normalizeInput(input);
  const updated = await collection().findOneAndUpdate(
    { _id: vehicleId, userId },
    { $set: { ...normalized, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!updated) {
    throw new ApiError(404, 'vehicle_not_found', 'Car not found.');
  }
  return toDto(updated);
};

export const deleteMemberVehicle = async (userId: string, vehicleId: string): Promise<void> => {
  const result = await collection().deleteOne({ _id: vehicleId, userId });
  if (result.deletedCount === 0) {
    throw new ApiError(404, 'vehicle_not_found', 'Car not found.');
  }
};

export const toRideshareVehiclePublic = (
  vehicle: MemberVehicleDTO
): import('@uaetrail/shared-types').RideshareVehiclePublicDTO => ({
  id: vehicle.id,
  make: vehicle.make,
  model: vehicle.model,
  color: vehicle.color,
  year: vehicle.year,
});
