import type { MemberVehicleColor } from '@uaetrail/shared-types';

export const MEMBER_VEHICLE_COLOR_LABELS: Record<MemberVehicleColor, string> = {
  white: 'White',
  black: 'Black',
  silver: 'Silver',
  gray: 'Gray',
  red: 'Red',
  blue: 'Blue',
  green: 'Green',
  beige: 'Beige',
  brown: 'Brown',
  orange: 'Orange',
  yellow: 'Yellow',
  other: 'Other',
};

/** Tile + car icon fill for saved cars and ride detail. */
export const memberVehicleColorTileClass = (color: MemberVehicleColor): string => {
  switch (color) {
    case 'white':
      return 'bg-white ring-1 ring-neutral-200 text-neutral-800';
    case 'black':
      return 'bg-neutral-900 text-white';
    case 'silver':
      return 'bg-gradient-to-br from-neutral-200 to-neutral-400 text-neutral-900';
    case 'gray':
      return 'bg-neutral-500 text-white';
    case 'red':
      return 'bg-red-600 text-white';
    case 'blue':
      return 'bg-sky-600 text-white';
    case 'green':
      return 'bg-emerald-600 text-white';
    case 'beige':
      return 'bg-amber-100 text-amber-950 ring-1 ring-amber-200';
    case 'brown':
      return 'bg-amber-900 text-amber-50';
    case 'orange':
      return 'bg-orange-500 text-white';
    case 'yellow':
      return 'bg-yellow-400 text-yellow-950';
    default:
      return 'bg-neutral-200 text-neutral-800';
  }
};
