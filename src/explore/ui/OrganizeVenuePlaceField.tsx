import { Link } from 'react-router-dom';
import type { PlaceDTO } from '@uaetrail/shared-types';
import { placeDetailPath } from '@uaetrail/shared-types';
import type { ActivityType } from '../../config/activityTypes';
import { PlaceSelect } from '../../components/ui/PlaceSelect';
import { EXPLORE_FLOW } from '../../config/exploreTheme';
import {
  ORGANIZE_VENUE_CUSTOM_NAME_BACK,
  ORGANIZE_VENUE_CUSTOM_NAME_TOGGLE,
  ORGANIZE_VENUE_REGISTRY_LABEL,
} from '../createFlowCopy';
import {
  ACTIVITY_DIFFICULTY_OPTIONS,
  resolveOrganizeDifficultyLabel,
  type ActivityDifficulty,
  type CreateActivityDraft,
} from './organizeFlow';
import { applyRegistryPlaceToOrganizeDraft } from './organizePlaceRegistryDraft';
import { exploreFlowChoiceCardClass } from './exploreFlowUi';

type PatchDraft = (patch: Partial<CreateActivityDraft>) => void;

export type OrganizeVenuePlaceFieldProps = {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
  tenantId?: string | null;
  /** Venue rows from {@link fetchPlaceRegistry} for this place type. */
  registryPlaces: PlaceDTO[];
  placeType: ActivityType;
  customNameLabel: string;
  customNamePlaceholder: string;
  showDifficulty?: boolean;
  /** Show registry-sourced difficulty above the picker (hiking destination). */
  registryDifficultyHint?: boolean;
};

export const OrganizeVenuePlaceField = ({
  draft,
  patchDraft,
  tenantId,
  registryPlaces,
  placeType,
  customNameLabel,
  customNamePlaceholder,
  showDifficulty = false,
  registryDifficultyHint = false,
}: OrganizeVenuePlaceFieldProps) => {
  const custom = draft.placeLabelSource === 'custom';
  const selectedPlace = registryPlaces.find((place) => place.id === draft.registryPlaceId);
  const hasRegistryVenue = Boolean(draft.registryPlaceId);

  const onRegistryPick = (placeId: string) => {
    const place = registryPlaces.find((item) => item.id === placeId);
    if (!place) {
      patchDraft({ registryPlaceId: placeId, placeLabelSource: 'registry' });
      return;
    }
    patchDraft(applyRegistryPlaceToOrganizeDraft(draft, place));
  };

  return (
    <>
      {!custom ? (
        <>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">
              {ORGANIZE_VENUE_REGISTRY_LABEL}
            </span>
            <PlaceSelect
              value={draft.registryPlaceId ?? ''}
              onChange={onRegistryPick}
              tenantId={tenantId ?? undefined}
              activityType={placeType}
              places={registryPlaces}
              required={false}
              placeholder="Select venue…"
            />
          </label>
          {selectedPlace ? (
            <>
              <p className="mt-2 text-xs text-gray-600">
                Registry venue ·{' '}
                <Link
                  to={placeDetailPath(selectedPlace.activityType, selectedPlace.id)}
                  className="font-semibold text-emerald-700 underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  View place details
                </Link>
              </p>
              {registryDifficultyHint && placeType === 'hiking' ? (
                <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-950">
                  Trail difficulty from registry:{' '}
                  <span className="font-semibold">{resolveOrganizeDifficultyLabel(draft.difficulty)}</span>
                  {showDifficulty ? ' — change below if this outing is different.' : null}
                </p>
              ) : null}
            </>
          ) : null}
          {!hasRegistryVenue ? (
            <button
              type="button"
              onClick={() =>
                patchDraft({
                  placeLabelSource: 'custom',
                  registryPlaceId: null,
                })
              }
              className="mt-4 text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline"
            >
              {ORGANIZE_VENUE_CUSTOM_NAME_TOGGLE}
            </button>
          ) : null}
        </>
      ) : (
        <>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">{customNameLabel}</span>
            <input
              value={draft.trailName}
              onChange={(event) =>
                patchDraft({
                  trailName: event.target.value,
                  registryPlaceId: null,
                  placeLabelSource: 'custom',
                })
              }
              placeholder={customNamePlaceholder}
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base"
              maxLength={120}
            />
          </label>
          <button
            type="button"
            onClick={() => patchDraft({ placeLabelSource: 'registry', trailName: '' })}
            className="mt-3 text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline"
          >
            {ORGANIZE_VENUE_CUSTOM_NAME_BACK}
          </button>
        </>
      )}

      {showDifficulty ? (
        <>
          <p className={`mb-2 mt-4 ${EXPLORE_FLOW.choiceCardTitle}`}>Difficulty</p>
          <div className="space-y-2">
            {ACTIVITY_DIFFICULTY_OPTIONS.map((option) => {
              const active = draft.difficulty === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => patchDraft({ difficulty: option.value as ActivityDifficulty })}
                  className={exploreFlowChoiceCardClass(active)}
                >
                  <p className={EXPLORE_FLOW.choiceCardTitle}>{option.title}</p>
                  <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </>
  );
};
