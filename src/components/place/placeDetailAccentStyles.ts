import type { PlaceDetailKindConfig } from '../../pages/placeDetailConfig';

export const ringClassForAccent = (
  accent: PlaceDetailKindConfig['accent'],
  selected: boolean
): string => {
  const map = {
    emerald: selected ? 'ring-emerald-600' : '',
    amber: selected ? 'ring-amber-600' : '',
    violet: selected ? 'ring-violet-600' : '',
  } as const;
  return map[accent];
};

export const seasonClassForAccent = (accent: PlaceDetailKindConfig['accent']): string => {
  const map = {
    emerald: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    violet: 'bg-violet-100 text-violet-800',
  } as const;
  return map[accent];
};

export const linkClassForAccent = (accent: PlaceDetailKindConfig['accent']): string => {
  const map = {
    emerald: 'text-emerald-600 hover:text-emerald-700',
    amber: 'text-amber-600 hover:text-amber-700',
    violet: 'text-violet-600 hover:text-violet-700',
  } as const;
  return map[accent];
};
