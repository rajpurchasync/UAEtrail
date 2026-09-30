import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { capitalize } from '../../utils';
import { PlaceDetailTabs, toPlaceDetailData } from '../../components/ui';
import type { ContributeDraft } from './contributeFlow';
import { buildVenueAccessibleBy } from './contributeFlow';

type ContributeCampingSpotPreviewProps = {
  draft: ContributeDraft;
};

/** In-wizard preview — mirrors `/camp/:id` (hero + overview tab). */
export const ContributeCampingSpotPreview = ({ draft }: ContributeCampingSpotPreviewProps) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const heroImage = draft.images[0] ?? null;

  const tabData = toPlaceDetailData(
    {
      name: draft.title.trim() || 'Camp spot',
      description: draft.description.trim(),
      region: draft.emirate.trim() || 'UAE',
      latitude: draft.latitude,
      longitude: draft.longitude,
      surfaceType: draft.surfaceTypes,
      accessibleBy: buildVenueAccessibleBy(draft),
    },
    'camping'
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div className="relative">
        {heroImage ? (
          <img
            src={draft.images[selectedImage] ?? heroImage}
            alt=""
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="flex h-48 flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 text-amber-900">
            <MapPin className="mb-2 h-8 w-8 text-amber-600" aria-hidden />
            <p className="text-sm font-medium">Add at least one photo</p>
          </div>
        )}
      </div>
      {draft.images.length > 1 ? (
        <div className="grid grid-cols-4 gap-1.5 p-2">
          {draft.images.slice(0, 5).map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedImage(index)}
              className={`h-14 overflow-hidden rounded-lg ${selectedImage === index ? 'ring-2 ring-amber-600' : ''}`}
            >
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="px-4 py-4">
        <h3 className="text-xl font-bold text-gray-900">{draft.title.trim() || 'Camp spot'}</h3>
        <div className="mt-1 flex items-center text-sm text-gray-600">
          <MapPin className="mr-1 h-4 w-4" />
          {draft.emirate}
        </div>

        {draft.surfaceTypes.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {draft.surfaceTypes.map((surface) => (
              <span
                key={surface}
                className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900"
              >
                {capitalize(surface)}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-4">
          <PlaceDetailTabs data={tabData} accent="amber" />
        </div>
      </div>
    </div>
  );
};
