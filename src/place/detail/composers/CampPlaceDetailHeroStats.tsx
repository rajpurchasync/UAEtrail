import { Tent, Users, Layers } from 'lucide-react';
import type { PlaceDetailHeroKindSectionProps } from './placeDetailHeroKindSectionProps';

const campingTypeLabel = (value: string) =>
  value === 'operator-led' ? 'Operator-led' : value === 'self-guided' ? 'Self-guided' : value;

/** Camp (`/camp/:id`) hero facts — group size, camping style, surface. */
export const CampPlaceDetailHeroStats = ({ place }: PlaceDetailHeroKindSectionProps) => {
  const surfaces = place.surfaceType?.filter(Boolean) ?? [];
  const show =
    Boolean(place.campingType) ||
    (place.maxGroupSize != null && place.maxGroupSize > 0) ||
    surfaces.length > 0;

  if (!show) return null;

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {place.campingType ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center text-gray-600 mb-1">
            <Tent className="w-5 h-5 mr-2" />
            <span className="text-sm">Camping</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{campingTypeLabel(place.campingType)}</div>
        </div>
      ) : null}
      {place.maxGroupSize != null && place.maxGroupSize > 0 ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center text-gray-600 mb-1">
            <Users className="w-5 h-5 mr-2" />
            <span className="text-sm">Group size</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">Up to {place.maxGroupSize}</div>
        </div>
      ) : null}
      {surfaces.length > 0 ? (
        <div className="bg-gray-50 p-4 rounded-lg col-span-2 sm:col-span-1">
          <div className="flex items-center text-gray-600 mb-1">
            <Layers className="w-5 h-5 mr-2" />
            <span className="text-sm">Surface</span>
          </div>
          <div className="text-sm font-semibold text-gray-900 leading-snug">
            {surfaces.slice(0, 3).join(' · ')}
            {surfaces.length > 3 ? ` +${surfaces.length - 3}` : ''}
          </div>
        </div>
      ) : null}
    </div>
  );
};
