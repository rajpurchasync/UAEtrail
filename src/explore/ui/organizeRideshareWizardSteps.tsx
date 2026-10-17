import { Baby, SlidersHorizontal, UserRound, Users } from 'lucide-react';
import { EXPLORE_FLOW } from '../../config/exploreTheme';
import { exploreFlowChoiceCardClass } from './exploreFlowUi';
import {
  PARTICIPANTS_ANYONE_SUBTITLE,
  PARTICIPANTS_ANYONE_TITLE,
  PARTICIPANTS_LIMITED_SUBTITLE,
  PARTICIPANTS_LIMITED_TITLE,
  PARTICIPANTS_MIN_AGE_LABEL,
  PARTICIPANTS_WHO_CAN_JOIN,
} from '../createFlowCopy';
import {
  formatCapacityLabel,
  RIDESHARE_CAPACITY_PRESETS,
  RIDESHARE_VEHICLE_OPTIONS,
  resolveLimitedAudienceAccess,
  type CreateActivityDraft,
  type VehicleAccess,
} from './hostingFlowEngine';
import {
  formatParticipantMinAgeFieldValue,
  parseParticipantMinAgeFieldValue,
} from './organizeParticipantAgeMin';

type PatchDraft = (patch: Partial<CreateActivityDraft>) => void;

/** Rideshare — always public on the map; host approval only. No private/RSVP toggles. */
export const RideshareAudienceStepBody = ({
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
      <p className="mb-2 text-sm text-gray-600">
        Rides are listed on the explore map. Choose who can request a seat.
      </p>
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

      <label className="mb-3 flex items-center gap-2 text-sm text-gray-800">
        <input
          type="checkbox"
          checked={draft.childrenAllowed}
          onChange={(event) => patchDraft({ childrenAllowed: event.target.checked })}
          className="rounded border-gray-300 text-emerald-600"
        />
        Children allowed
      </label>
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

export const RideshareSeatsStepBody = ({
  draft,
  patchDraft,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
}) => (
  <>
    <p className="mb-3 text-sm text-gray-600">How many passenger seats can you offer? (max 10)</p>
    <div className="flex flex-wrap gap-2">
      {RIDESHARE_CAPACITY_PRESETS.map((value) => {
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
            {formatCapacityLabel(value)}
          </button>
        );
      })}
    </div>
  </>
);

export const RideshareTransportationStepBody = ({
  draft,
  patchDraft,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
}) => (
  <>
    <p className="mb-3 text-sm text-gray-600">What are you driving?</p>
    <div className={`${EXPLORE_FLOW.choiceGrid2}`}>
      {RIDESHARE_VEHICLE_OPTIONS.map((option) => {
        const active = draft.vehicleAccess === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => patchDraft({ vehicleAccess: option.value as VehicleAccess })}
            className={exploreFlowChoiceCardClass(active)}
          >
            <p className={EXPLORE_FLOW.choiceCardTitle}>{option.title}</p>
          </button>
        );
      })}
    </div>
  </>
);
