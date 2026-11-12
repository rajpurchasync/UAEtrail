import { Link, useLocation } from 'react-router-dom';
import { Baby, Plus, SlidersHorizontal, UserRound, Users } from 'lucide-react';
import { formatRideshareVehicleLabel } from '@uaetrail/shared-types';
import { EXPLORE_FLOW } from '../../../../../config/exploreTheme';
import { PROFILE_VEHICLES_PATH } from '../../../../../config/surfacePaths';
import { mobileBackNavState } from '../../../../../utils/mobileBackNav';
import { exploreFlowChoiceCardClass } from '../../../exploreFlowUi';
import {
  PARTICIPANTS_ANYONE_SUBTITLE,
  PARTICIPANTS_ANYONE_TITLE,
  PARTICIPANTS_LIMITED_SUBTITLE,
  PARTICIPANTS_LIMITED_TITLE,
  PARTICIPANTS_MIN_AGE_LABEL,
  PARTICIPANTS_WHO_CAN_JOIN,
} from '../../../../createFlowCopy';
import {
  formatCapacityLabel,
  RIDESHARE_CAPACITY_PRESETS,
  resolveLimitedAudienceAccess,
  type CreateActivityDraft,
} from '../../../hostingFlowEngine';
import {
  formatParticipantMinAgeFieldValue,
  parseParticipantMinAgeFieldValue,
  DEFAULT_PARTICIPANT_MIN_AGE,
} from '../../../hostingParticipantAgeMin';
import { useMemberVehicles } from '../../../../../hooks/useMemberVehicles';
import { MemberVehicleCarIcon } from '../../../../../components/vehicles/MemberVehicleCarIcon';
import { MEMBER_VEHICLE_COLOR_LABELS } from '../../../../../components/vehicles/memberVehicleColorChrome';

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
      <p className="mb-2 text-sm text-neutral-600">
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
              <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-neutral-500'}`} />
              <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.title}</p>
              <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
            </button>
          );
        })}
      </div>

      {!draft.participantsOpenToAll ? (
        <div className="mb-4 space-y-2 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-3">
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
                  className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base font-semibold text-neutral-900"
                  aria-label={PARTICIPANTS_MIN_AGE_LABEL}
                />
              ) : null}
            </span>
          </label>
        </div>
      ) : null}

      <label className="mb-3 flex items-center gap-2 text-sm text-neutral-800">
        <input
          type="checkbox"
          checked={draft.childrenAllowed}
          onChange={(event) => patchDraft({ childrenAllowed: event.target.checked })}
          className="rounded border-gray-300 text-emerald-600"
        />
        Children allowed
      </label>
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

export const RideshareSeatsStepBody = ({
  draft,
  patchDraft,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
}) => (
  <>
    <p className="mb-3 text-sm text-neutral-600">How many passenger seats can you offer? (max 10)</p>
    <div className="flex flex-wrap gap-2">
      {RIDESHARE_CAPACITY_PRESETS.map((value) => {
        const active = draft.capacity === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => patchDraft({ capacity: value })}
            className={`rounded-full px-4 py-2 text-sm font-bold ${
              active ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-800'
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
}) => {
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;
  const garageBack = mobileBackNavState(returnTo, 'Rideshare');
  const { data: vehicles = [], isLoading } = useMemberVehicles();

  if (isLoading) {
    return <p className="text-sm text-neutral-500">Loading your cars…</p>;
  }

  if (vehicles.length === 0) {
    return (
      <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-center">
        <p className="text-sm font-semibold text-sky-950">Add your car first</p>
        <p className="mt-1 text-xs text-sky-900/80">
          Make, model, color, year, and plate — plate is shared with your ride crew after they join.
        </p>
        <Link
          to={`${PROFILE_VEHICLES_PATH}/new`}
          state={garageBack}
          data-nav-focus="rideshare-add-car"
          className="mt-4 inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add car
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mb-3 text-sm text-neutral-600">Which car are you driving for this ride?</p>
      <div className="space-y-2">
        {vehicles.map((vehicle) => {
          const active = draft.memberVehicleId === vehicle.id;
          return (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => patchDraft({ memberVehicleId: vehicle.id })}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${
                active ? 'border-emerald-500 bg-emerald-50/90' : 'border-neutral-200 bg-white'
              }`}
            >
              <MemberVehicleCarIcon color={vehicle.color} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-950">
                  {formatRideshareVehicleLabel(vehicle)}
                </p>
                <p className="text-xs text-neutral-600">{MEMBER_VEHICLE_COLOR_LABELS[vehicle.color]}</p>
              </div>
            </button>
          );
        })}
      </div>
      <Link
        to={PROFILE_VEHICLES_PATH}
        state={garageBack}
        data-nav-focus="rideshare-manage-cars"
        className="mt-3 inline-flex text-sm font-semibold text-emerald-700"
      >
        Manage cars in profile
      </Link>
    </>
  );
};

/** Publish review — selected garage car (not generic body-type label). */
export const RidesharePublishLogisticsPreview = ({
  memberVehicleId,
  fallbackLabel,
}: {
  memberVehicleId: string | null;
  fallbackLabel: string;
}) => {
  const { data: vehicles = [], isLoading } = useMemberVehicles();
  const vehicle = memberVehicleId ? vehicles.find((row) => row.id === memberVehicleId) : null;

  if (isLoading) {
    return <p className="text-sm text-neutral-500">Loading your car…</p>;
  }

  if (vehicle) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-neutral-200/90 bg-white px-3 py-2.5">
        <MemberVehicleCarIcon color={vehicle.color} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900">{formatRideshareVehicleLabel(vehicle)}</p>
          <p className="text-xs text-neutral-600">{MEMBER_VEHICLE_COLOR_LABELS[vehicle.color]}</p>
        </div>
      </div>
    );
  }

  return <p className="text-sm text-neutral-800">{fallbackLabel}</p>;
};
