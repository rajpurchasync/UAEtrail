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

/** Rideshare car on listings — make/model/color/year for everyone; plate only for ride crew. */
export interface RideshareVehiclePublicDTO {
  id: string;
  make: string;
  model: string;
  color: MemberVehicleColor;
  year: number;
  /** Host + confirmed participants on the outing only — never on member public profile. */
  plateNumber?: string;
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
