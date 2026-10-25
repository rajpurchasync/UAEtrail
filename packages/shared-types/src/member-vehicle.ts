export const MEMBER_VEHICLE_COLORS = [
  'white',
  'black',
  'silver',
  'gray',
  'red',
  'blue',
  'green',
  'beige',
  'brown',
  'orange',
  'yellow',
  'other',
] as const;

export type MemberVehicleColor = (typeof MEMBER_VEHICLE_COLORS)[number];

export interface MemberVehicleDTO {
  id: string;
  make: string;
  model: string;
  color: MemberVehicleColor;
  year: number;
  plateNumber: string;
  createdAt: string;
  updatedAt: string;
}

/** Public rideshare detail — no plate number. */
export interface RideshareVehiclePublicDTO {
  id: string;
  make: string;
  model: string;
  color: MemberVehicleColor;
  year: number;
}

export interface UpsertMemberVehicleInput {
  make: string;
  model: string;
  color: MemberVehicleColor;
  year: number;
  plateNumber: string;
}

export const formatRideshareVehicleLabel = (vehicle: RideshareVehiclePublicDTO): string =>
  `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
