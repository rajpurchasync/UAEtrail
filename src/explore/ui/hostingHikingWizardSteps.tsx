import { useEffect } from 'react';
import {
  BadgeCheck,
  Baby,
  ClipboardCheck,
  Lock,
  SlidersHorizontal,
  UserRound,
  Users,
} from 'lucide-react';
import { HostingPackingListEditor } from './HostingPackingListEditor';
import { defaultHikingPackingItems, withHikingKitExtras } from '@uaetrail/shared-types';
import {
  formatHikeCapacityLabel,
  HIKE_CAPACITY_PRESETS,
  ACTIVITY_DIFFICULTY_OPTIONS,
  resolveLimitedAudienceAccess,
  type ActivityDifficulty,
  type CreateActivityDraft,
} from './hostingFlowEngine';
import {
  formatParticipantMinAgeFieldValue,
  parseParticipantMinAgeFieldValue,
  DEFAULT_PARTICIPANT_MIN_AGE,
} from './hostingParticipantAgeMin';
import { HostingVenuePlaceField } from './HostingVenuePlaceField';
import type { PlaceDTO } from '@uaetrail/shared-types';
import {
  HIKE_APPROVAL_NO_LABEL,
  HIKE_APPROVAL_NO_SUBTITLE,
  HIKE_APPROVAL_QUESTION,
  HIKE_APPROVAL_YES_LABEL,
  HIKE_APPROVAL_YES_SUBTITLE,
  HIKE_PRIVATE_EVENT_INFO,
  HIKE_PRIVATE_EVENT_LABEL,
  HIKE_PRIVATE_EVENT_SUBTITLE,
  HIKE_PUBLIC_EVENT_LABEL,
  HIKE_PUBLIC_EVENT_SUBTITLE,
  JOIN_RULES_LABEL,
  PARTICIPANTS_ANYONE_SUBTITLE,
  PARTICIPANTS_ANYONE_TITLE,
  PARTICIPANTS_LIMITED_SUBTITLE,
  PARTICIPANTS_LIMITED_TITLE,
  PARTICIPANTS_MIN_AGE_LABEL,
  PARTICIPANTS_SPOTS_QUESTION,
  PARTICIPANTS_WHO_CAN_JOIN,
} from '../createFlowCopy';
import { EXPLORE_FLOW } from '../../config/exploreTheme';
import { exploreFlowChoiceCardClass } from './exploreFlowUi';
import type { JoinMode, ParticipationMode } from './hostingFlowEngine';

type PatchDraft = (patch: Partial<CreateActivityDraft>) => void;

export const HikingAudienceStepBody = ({
  draft,
  patchDraft,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
}) => {
  const isPublic = draft.joinMode === 'open';

  return (
    <>
      <div className={`mb-4 ${EXPLORE_FLOW.choiceGrid2}`}>
        {([
          {
            key: 'open' as JoinMode,
            title: HIKE_PUBLIC_EVENT_LABEL,
            subtitle: HIKE_PUBLIC_EVENT_SUBTITLE,
            icon: Users,
          },
          {
            key: 'private' as JoinMode,
            title: HIKE_PRIVATE_EVENT_LABEL,
            subtitle: HIKE_PRIVATE_EVENT_SUBTITLE,
            icon: Lock,
          },
        ]).map((option) => {
          const active = draft.joinMode === option.key;
          const Icon = option.icon;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() =>
                patchDraft(
                  option.key === 'private'
                    ? { joinMode: 'private', participationMode: 'rsvp' }
                    : { joinMode: 'open' }
                )
              }
              className={exploreFlowChoiceCardClass(active)}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-neutral-500'}`} />
              <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.title}</p>
              <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <div className={isPublic ? undefined : 'invisible'} aria-hidden={!isPublic}>
          <p className={`mb-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{HIKE_APPROVAL_QUESTION}</p>
          <div className={EXPLORE_FLOW.choiceGrid2}>
            {([
              {
                key: 'approval' as const,
                title: HIKE_APPROVAL_YES_LABEL,
                subtitle: HIKE_APPROVAL_YES_SUBTITLE,
                icon: ClipboardCheck,
              },
              {
                key: 'rsvp' as const,
                title: HIKE_APPROVAL_NO_LABEL,
                subtitle: HIKE_APPROVAL_NO_SUBTITLE,
                icon: BadgeCheck,
              },
            ]).map((option) => {
              const active = draft.participationMode === option.key;
              const Icon = option.icon;
              return (
                <button
                  key={option.key}
                  type="button"
                  tabIndex={isPublic ? 0 : -1}
                  disabled={!isPublic}
                  onClick={() => patchDraft({ participationMode: option.key as ParticipationMode })}
                  className={exploreFlowChoiceCardClass(active)}
                >
                  <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-neutral-500'}`} />
                  <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.title}</p>
                  <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
                </button>
              );
            })}
          </div>
        </div>
        {!isPublic ? (
          <div className="absolute inset-0 flex items-start">
            <p className="w-full rounded-xl bg-neutral-50 px-3 py-2 text-sm leading-snug text-neutral-600">
              {HIKE_PRIVATE_EVENT_INFO}
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
};

export const HikingSpotsStepBody = ({
  draft,
  patchDraft,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
}) => {
  const patchAudience = (patch: Partial<CreateActivityDraft>) => {
    const next = { ...draft, ...patch };
    if (next.participantsOpenToAll) {
      patchDraft({ ...patch, audienceAccess: 'anyone' });
      return;
    }
    patchDraft({
      ...patch,
      audienceAccess: resolveLimitedAudienceAccess(next),
    });
  };

  return (
    <>
      <p className={`mb-3 ${EXPLORE_FLOW.choiceCardTitle}`}>{PARTICIPANTS_SPOTS_QUESTION}</p>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {HIKE_CAPACITY_PRESETS.map((value) => {
          const active = draft.capacity === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => patchDraft({ capacity: value })}
              className={`rounded-full px-4 py-2 text-sm font-bold md:px-3 md:py-1.5 md:text-xs ${
                active ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-800'
              }`}
            >
              {formatHikeCapacityLabel(value)}
            </button>
          );
        })}
        <label className="flex items-center gap-2 text-sm text-neutral-700 md:ml-2">
          <span className="whitespace-nowrap text-neutral-500">Custom</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={99}
            value={draft.capacity}
            onChange={(event) => {
              const raw = Number(event.target.value);
              if (!Number.isFinite(raw)) return;
              patchDraft({ capacity: Math.min(99, Math.max(1, Math.round(raw))) });
            }}
            className={`w-16 ${EXPLORE_FLOW.composeField}`}
            aria-label="Number of spots"
          />
        </label>
      </div>

      <p className={`mb-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{PARTICIPANTS_WHO_CAN_JOIN}</p>
      <div className="md:grid md:grid-cols-[minmax(0,1fr)_minmax(11rem,14rem)] md:items-start md:gap-4">
        <div className={`mb-3 md:mb-0 ${EXPLORE_FLOW.choiceGrid2}`}>
        {([
          {
            key: 'open' as const,
            title: PARTICIPANTS_ANYONE_TITLE,
            subtitle: PARTICIPANTS_ANYONE_SUBTITLE,
            icon: Users,
          },
          {
            key: 'limited' as const,
            title: PARTICIPANTS_LIMITED_TITLE,
            subtitle: PARTICIPANTS_LIMITED_SUBTITLE,
            icon: SlidersHorizontal,
          },
        ]).map((option) => {
          const active =
            option.key === 'open' ? draft.participantsOpenToAll : !draft.participantsOpenToAll;
          const Icon = option.icon;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() =>
                patchAudience(
                  option.key === 'open'
                    ? {
                        participantsOpenToAll: true,
                        limitedWomenOnly: false,
                        limitedFamilyOnly: false,
                        limitedMinAgeEnabled: false,
                      }
                    : { participantsOpenToAll: false }
                )
              }
              className={exploreFlowChoiceCardClass(active)}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-neutral-500'}`} />
              <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.title}</p>
              <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
            </button>
          );
        })}
        </div>

        <div
          className={`mb-4 min-h-[9.5rem] rounded-xl border p-2.5 md:mb-0 ${
            draft.participantsOpenToAll
              ? 'border-dashed border-neutral-200 bg-neutral-50/40'
              : 'border-neutral-200 bg-neutral-50/80'
          }`}
        >
          {draft.participantsOpenToAll ? (
            <p className="px-1 py-6 text-center text-xs leading-snug text-neutral-400">
              Choose <span className="font-semibold text-neutral-500">Limited</span> to set who can join.
            </p>
          ) : (
            <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-800">
            <input
              type="checkbox"
              checked={draft.limitedWomenOnly}
              onChange={(event) => patchAudience({ limitedWomenOnly: event.target.checked })}
              className="rounded border-gray-300 text-emerald-600"
            />
            <UserRound className="h-4 w-4 text-emerald-600" aria-hidden />
            Women only
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-800">
            <input
              type="checkbox"
              checked={draft.limitedFamilyOnly}
              onChange={(event) => patchAudience({ limitedFamilyOnly: event.target.checked })}
              className="rounded border-gray-300 text-emerald-600"
            />
            <Users className="h-4 w-4 text-emerald-600" aria-hidden />
            Family only
          </label>
          <label className="flex items-start gap-2 text-sm font-medium text-neutral-800">
            <input
              type="checkbox"
              checked={draft.limitedMinAgeEnabled}
              onChange={(event) => {
                const enabled = event.target.checked;
                patchAudience({
                  limitedMinAgeEnabled: enabled,
                  ...(enabled && draft.ageMin < 1 ? { ageMin: DEFAULT_PARTICIPANT_MIN_AGE } : null),
                });
              }}
              className="mt-0.5 rounded border-gray-300 text-emerald-600"
            />
            <Baby className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block">{PARTICIPANTS_MIN_AGE_LABEL}</span>
              {draft.limitedMinAgeEnabled ? (
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={99}
                  placeholder={String(DEFAULT_PARTICIPANT_MIN_AGE)}
                  value={formatParticipantMinAgeFieldValue(draft.ageMin)}
                  onChange={(event) =>
                    patchDraft({ ageMin: parseParticipantMinAgeFieldValue(event.target.value) })
                  }
                  className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base font-semibold text-neutral-900 md:mt-1 md:py-1.5 md:text-sm"
                  aria-label={PARTICIPANTS_MIN_AGE_LABEL}
                />
              ) : null}
            </span>
          </label>
            </div>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-800">
        <input
          type="checkbox"
          checked={draft.petsAllowed}
          onChange={(event) => patchDraft({ petsAllowed: event.target.checked })}
          className="rounded border-gray-300 text-emerald-600"
        />
        Pets allowed
      </label>
    </>
  );
};

export const HikingDestinationStepBody = ({
  draft,
  patchDraft,
  tenantId,
  registryPlaces,
  onOpenSpotMap,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
  tenantId?: string | null;
  registryPlaces: PlaceDTO[];
  onOpenSpotMap?: () => void;
}) => (
  <HostingVenuePlaceField
    draft={draft}
    patchDraft={patchDraft}
    tenantId={tenantId}
    registryPlaces={registryPlaces}
    placeType="hiking"
    customNameLabel="Trail or area"
    customNamePlaceholder="e.g. Wadi Shawka loop"
    showDifficulty={Boolean(draft.registryPlaceId)}
    registryDifficultyHint
    onOpenSpotMap={onOpenSpotMap}
  />
);

export const HikingTrailStatsFields = ({
  draft,
  patchDraft,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
}) => (
  <div className="mt-4 grid grid-cols-2 gap-3">
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-neutral-500">Length (km)</span>
      <input
        type="number"
        min={0.1}
        step={0.1}
        inputMode="decimal"
        required
        value={draft.trailDistanceKm ?? ''}
        onChange={(event) => {
          const raw = event.target.value;
          patchDraft({ trailDistanceKm: raw === '' ? null : Number(raw) });
        }}
        placeholder="e.g. 8.5"
        className={EXPLORE_FLOW.composeField}
      />
    </label>
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-neutral-500">Elevation gain (m)</span>
      <input
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        required
        value={draft.trailElevationM ?? ''}
        onChange={(event) => {
          const raw = event.target.value;
          patchDraft({ trailElevationM: raw === '' ? null : Number(raw) });
        }}
        placeholder="e.g. 450"
        className={EXPLORE_FLOW.composeField}
      />
    </label>
  </div>
);

export const HikingDifficultyStepBody = ({
  draft,
  patchDraft,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
}) => (
  <>
    <p className="mb-3 text-sm text-neutral-600 md:mb-2 md:text-xs">
      Set difficulty and trail stats for this outing — registry trails prefill when you pick one.
    </p>
    <div className="flex flex-col gap-2 md:flex-row md:flex-nowrap md:gap-2">
      {ACTIVITY_DIFFICULTY_OPTIONS.map((option) => {
        const active = draft.difficulty === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => patchDraft({ difficulty: option.value as ActivityDifficulty })}
            className={`${exploreFlowChoiceCardClass(active)} md:flex-1 md:min-w-0 md:px-2 md:py-2`}
          >
            <p className={`${EXPLORE_FLOW.choiceCardTitle} md:text-xs`}>{option.title}</p>
            <p className={`${EXPLORE_FLOW.choiceCardSubtitle} md:hidden`}>{option.subtitle}</p>
          </button>
        );
      })}
    </div>
    <HikingTrailStatsFields draft={draft} patchDraft={patchDraft} />
  </>
);

export const HikingAboutTrailStepBody = ({
  draft,
  patchDraft,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
}) => (
  <textarea
    value={draft.aboutTrail}
    onChange={(event) => patchDraft({ aboutTrail: event.target.value })}
    rows={5}
    placeholder="Distance, terrain, pace, what makes this hike special…"
    aria-label="About the trail"
    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base"
    maxLength={2000}
  />
);

export const HikingJoinKitStepBody = ({
  draft,
  patchDraft,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
}) => {
  useEffect(() => {
    if (draft.kind !== 'hiking') return;
    if ((draft.packingItems?.length ?? 0) === 0) {
      patchDraft({ packingItems: defaultHikingPackingItems(), packingAckMode: 'strict' });
      return;
    }
    const next = withHikingKitExtras(draft.packingItems);
    if (next.length !== draft.packingItems.length) patchDraft({ packingItems: next });
  }, [draft.kind, draft.packingItems, patchDraft]);

  return (
    <div className="space-y-4">
      <HostingPackingListEditor
        mode={draft.packingAckMode}
        items={draft.packingItems ?? []}
        defaultMode="strict"
        onChange={patchDraft}
      />
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-neutral-800">{JOIN_RULES_LABEL}</span>
        <textarea
          value={draft.joinKit}
          onChange={(event) => patchDraft({ joinKit: event.target.value })}
          rows={4}
          placeholder="Anything else joiners should know…"
          aria-label={JOIN_RULES_LABEL}
          className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base leading-relaxed"
          maxLength={1000}
        />
      </label>
    </div>
  );
};
