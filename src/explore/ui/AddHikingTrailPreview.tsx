import { useState } from 'react';
import { MapPin, TrendingUp, Mountain } from 'lucide-react';
import { capitalize, getDifficultyColor } from '../../utils';
import { PlaceDetailTabs, toPlaceDetailData } from '../../components/ui';
import type { AddDraft } from './addFlow';
import { ACTIVITY_DIFFICULTY_OPTIONS, buildVenueAccessibleBy } from './addFlow';
import type { ActivityDifficulty } from './createFlowShared';

const toApiDifficulty = (value: ActivityDifficulty): 'easy' | 'moderate' | 'hard' =>
  value === 'medium' ? 'moderate' : value;

type AddHikingTrailPreviewProps = {
  draft: AddDraft;
};

/** In-wizard preview — mirrors `/trail/:id` layout (hero, stats, overview tab). */
export const AddHikingTrailPreview = ({ draft }: AddHikingTrailPreviewProps) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const heroImage = draft.images[0] ?? null;
  const difficultyLabel = ACTIVITY_DIFFICULTY_OPTIONS.find((option) => option.value === draft.difficulty)?.title;
  const apiDifficulty = draft.difficulty ? toApiDifficulty(draft.difficulty) : undefined;

  const tabData = toPlaceDetailData(
    {
      name: draft.title.trim() || 'Trail title',
      description: draft.description.trim(),
      region: draft.emirate.trim() || 'UAE',
      latitude: draft.latitude,
      longitude: draft.longitude,
      distance: draft.trailDistanceKm ?? undefined,
      elevation: draft.trailElevationM ?? undefined,
      difficulty: apiDifficulty,
      accessibleBy: buildVenueAccessibleBy(draft),
    },
    'hiking'
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
          <div className="flex h-48 flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600">
            <MapPin className="mb-2 h-8 w-8 text-slate-400" aria-hidden />
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
              className={`h-14 overflow-hidden rounded-lg ${selectedImage === index ? 'ring-2 ring-emerald-600' : ''}`}
            >
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="px-4 py-4">
        <div className={`mb-3 ${draft.difficulty ? 'flex items-start justify-between gap-3' : ''}`}>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{draft.title.trim() || 'Trail title'}</h3>
            <div className="mt-1 flex items-center text-sm text-gray-600">
              <MapPin className="mr-1 h-4 w-4" />
              {draft.emirate}
            </div>
          </div>
          {draft.difficulty && apiDifficulty ? (
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getDifficultyColor(apiDifficulty)}`}>
              {difficultyLabel ?? capitalize(apiDifficulty)}
            </span>
          ) : null}
        </div>

        {(draft.trailDistanceKm != null || draft.trailElevationM != null) && (
          <div className="mb-4 grid grid-cols-2 gap-3">
            {draft.trailDistanceKm != null && draft.trailDistanceKm > 0 ? (
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="mb-1 flex items-center text-xs text-gray-600">
                  <TrendingUp className="mr-1.5 h-4 w-4" />
                  Distance
                </div>
                <div className="text-lg font-bold text-gray-900">{draft.trailDistanceKm} km</div>
              </div>
            ) : null}
            {draft.trailElevationM != null && draft.trailElevationM >= 0 ? (
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="mb-1 flex items-center text-xs text-gray-600">
                  <Mountain className="mr-1.5 h-4 w-4" />
                  Elevation
                </div>
                <div className="text-lg font-bold text-gray-900">{draft.trailElevationM} m</div>
              </div>
            ) : null}
          </div>
        )}

        <PlaceDetailTabs data={tabData} accent="emerald" />
      </div>
    </div>
  );
};
