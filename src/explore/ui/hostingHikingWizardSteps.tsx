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
import { ensureHikingJoinKitText } from './hikingJoinKitDefaults';
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
              <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-gray-500'}`} />
              <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.title}</p>
              <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
            </button>
          );
        })}
      </div>

      {isPublic ? (
        <div>
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
                  onClick={() => patchDraft({ participationMode: option.key as ParticipationMode })}
                  className={exploreFlowChoiceCardClass(active)}
                >
                  <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-gray-500'}`} />
                  <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.title}</p>
                  <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="rounded-xl bg-neutral-50 px-3 py-2 text-sm text-gray-600">{HIKE_PRIVATE_EVENT_INFO}</p>
      )}
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
      <div className="mb-5 flex flex-wrap gap-2">
        {HIKE_CAPACITY_PRESETS.map((value) => {
          const active = draft.capacity === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => patchDraft({ capacity: value })}
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                active ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-gray-800'
              }`}
            >
              {formatHikeCapacityLabel(value)}
            </button>
          );
        })}
      </div>

      <p className={`mb-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{PARTICIPANTS_WHO_CAN_JOIN}</p>
      <div className={`mb-3 ${EXPLORE_FLOW.choiceGrid2}`}>
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
              <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-gray-500'}`} />
              <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.title}</p>
              <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
            </button>
          );
        })}
      </div>

      {!draft.participantsOpenToAll ? (
        <div className="mb-4 space-y-2 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <input
              type="checkbox"
              checked={draft.limitedWomenOnly}
              onChange={(event) => patchAudience({ limitedWomenOnly: event.target.checked })}
              className="rounded border-gray-300 text-emerald-600"
            />
            <UserRound className="h-4 w-4 text-emerald-600" aria-hidden />
            Women only
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <input
              type="checkbox"
              checked={draft.limitedFamilyOnly}
              onChange={(event) => patchAudience({ limitedFamilyOnly: event.target.checked })}
              className="rounded border-gray-300 text-emerald-600"
            />
            <Users className="h-4 w-4 text-emerald-600" aria-hidden />
            Family only
          </label>
          <label className="flex items-start gap-2 text-sm font-medium text-gray-800">
            <input
              type="checkbox"
              checked={draft.limitedMinAgeEnabled}
              onChange={(event) =>
                patchAudience({ limitedMinAgeEnabled: event.target.checked })
              }
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
                  value={formatParticipantMinAgeFieldValue(draft.ageMin)}
                  onChange={(event) =>
                    patchDraft({ ageMin: parseParticipantMinAgeFieldValue(event.target.value) })
                  }
                  className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base font-semibold text-gray-900"
                  aria-label={PARTICIPANTS_MIN_AGE_LABEL}
                />
              ) : null}
            </span>
          </label>
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-gray-800">
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
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
  tenantId?: string | null;
  registryPlaces: PlaceDTO[];
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
  />
);

export const HikingDifficultyStepBody = ({
  draft,
  patchDraft,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
}) => (
  <>
    <p className="mb-3 text-sm text-gray-600">
      For this outing — registry trails may suggest a level; you can change it here.
    </p>
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
    if (draft.kind === 'hiking' && !draft.joinKit.trim()) {
      patchDraft({ joinKit: ensureHikingJoinKitText('') });
    }
  }, [draft.kind, draft.joinKit, patchDraft]);

  return (
    <textarea
      value={draft.joinKit}
      onChange={(event) => patchDraft({ joinKit: event.target.value })}
      rows={12}
      placeholder="Water, shoes, headlamp, fitness level, rules…"
      aria-label={JOIN_RULES_LABEL}
      className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base leading-relaxed"
      maxLength={1000}
    />
  );
};
