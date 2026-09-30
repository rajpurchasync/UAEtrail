import { EXPLORE_FLOW } from '../../config/exploreTheme';
import { getVenueStateFilterOptions } from '../../config/regions';
import { exploreFlowChoiceCardClass } from './exploreFlowUi';
import {
  DEMAND_FITNESS_OPTIONS,
  DEMAND_SELF_VEHICLE_OPTIONS,
  type DemandDraft,
  type DemandFitnessLevel,
  type DemandKind,
  type DemandVehicleType,
} from './demandFlow';

type PatchDraft = (patch: Partial<DemandDraft>) => void;

export const DemandDestinationStepBody = ({
  draft,
  patchDraft,
}: {
  draft: DemandDraft;
  patchDraft: PatchDraft;
}) => (
  <>
    <p className="mb-3 text-sm text-gray-600">Which emirate or region are you hoping to go?</p>
    <div className={`${EXPLORE_FLOW.choiceGrid2}`}>
      {getVenueStateFilterOptions().map((option) => {
        const active = draft.preferredArea === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => patchDraft({ preferredArea: option.key })}
            className={exploreFlowChoiceCardClass(active)}
          >
            <p className={EXPLORE_FLOW.choiceCardTitle}>{option.label}</p>
          </button>
        );
      })}
    </div>
  </>
);

/** Audience restrictions for find/demand — no public/private toggle (always on map when pinned). */
export const DemandAudienceStepBody = ({
  draft,
  patchDraft,
  kind,
}: {
  draft: DemandDraft;
  patchDraft: PatchDraft;
  kind: DemandKind;
}) => (
  <>
    <p className="mb-3 text-sm text-gray-600">
      Optional filters so hosts know who you&apos;re looking for. Your post is public on the map when you add a pin.
    </p>
    <div className="space-y-2">
      <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3">
        <input
          type="checkbox"
          checked={draft.womenOnly}
          onChange={(event) => patchDraft({ womenOnly: event.target.checked })}
          className="rounded border-gray-300 text-emerald-600"
        />
        <span className="text-sm text-gray-800">Women only</span>
      </label>
      <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3">
        <input
          type="checkbox"
          checked={draft.childrenAllowed}
          onChange={(event) => patchDraft({ childrenAllowed: event.target.checked })}
          className="rounded border-gray-300 text-emerald-600"
        />
        <span className="text-sm text-gray-800">Children in my group</span>
      </label>
      <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3">
        <input
          type="checkbox"
          checked={draft.petsAllowed}
          onChange={(event) => patchDraft({ petsAllowed: event.target.checked })}
          className="rounded border-gray-300 text-emerald-600"
        />
        <span className="text-sm text-gray-800">Traveling with pets</span>
      </label>
    </div>
    {kind === 'hiking' ? (
      <div className="mt-4 space-y-3">
        <p className={`${EXPLORE_FLOW.choiceCardTitle}`}>Fitness level</p>
        {DEMAND_FITNESS_OPTIONS.map((option) => {
          const active = draft.fitnessLevel === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => patchDraft({ fitnessLevel: option.value as DemandFitnessLevel })}
              className={`w-full rounded-2xl border-2 px-4 py-3 text-left ${
                active ? 'border-emerald-500 bg-emerald-50/50' : 'border-neutral-200 bg-white'
              }`}
            >
              <p className="text-sm font-bold text-gray-900">{option.title}</p>
              <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
            </button>
          );
        })}
      </div>
    ) : null}
  </>
);

export const DemandTransportStepBody = ({
  draft,
  patchDraft,
}: {
  draft: DemandDraft;
  patchDraft: PatchDraft;
}) => (
  <>
    <p className="mb-3 text-sm text-gray-600">How will you get there?</p>
    <div className={`mb-4 ${EXPLORE_FLOW.choiceGrid2}`}>
      {([
        { key: 'self' as const, title: 'Self transport', subtitle: 'I have a vehicle' },
        { key: 'carpool' as const, title: 'Carpool needed', subtitle: 'Need a ride' },
      ]).map((option) => {
        const active = draft.transportMode === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() =>
              patchDraft({
                transportMode: option.key,
                carPoolNeeded: option.key === 'carpool',
                selfVehicleType: option.key === 'self' ? draft.selfVehicleType ?? 'sedan' : null,
              })
            }
            className={exploreFlowChoiceCardClass(active)}
          >
            <p className={EXPLORE_FLOW.choiceCardTitle}>{option.title}</p>
            <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
          </button>
        );
      })}
    </div>
    {draft.transportMode === 'self' ? (
      <div className={`${EXPLORE_FLOW.choiceGrid2}`}>
        {DEMAND_SELF_VEHICLE_OPTIONS.map((option) => {
          const active = draft.selfVehicleType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => patchDraft({ selfVehicleType: option.value as DemandVehicleType })}
              className={exploreFlowChoiceCardClass(active)}
            >
              <p className={EXPLORE_FLOW.choiceCardTitle}>{option.title}</p>
            </button>
          );
        })}
      </div>
    ) : draft.transportMode === 'carpool' ? (
      <>
        <p className="mb-2 text-sm font-semibold text-gray-900">Seats you need (including you)</p>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((value) => {
            const active = draft.carpoolSeatsNeeded === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => patchDraft({ carpoolSeatsNeeded: value, partySize: value })}
                className={`rounded-full px-4 py-2 text-sm font-bold ${
                  active ? 'bg-emerald-500 text-white' : 'bg-neutral-100 text-gray-800'
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>
      </>
    ) : null}
  </>
);

export const DemandCarpoolDestinationStepBody = ({
  draft,
  patchDraft,
  onOpenMap,
}: {
  draft: DemandDraft;
  patchDraft: PatchDraft;
  onOpenMap: () => void;
}) => (
  <>
    <p className="mb-4 text-sm text-gray-600">Pin your destination and say if the drop-off time is fixed or flexible.</p>
    <button
      type="button"
      onClick={onOpenMap}
      className="mb-4 flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left hover:border-emerald-300"
    >
      <span className="text-sm font-bold text-gray-800">
        {draft.toPinPlaced
          ? `Destination · ${draft.toLatitude?.toFixed(4)}, ${draft.toLongitude?.toFixed(4)}`
          : 'Drop destination pin'}
      </span>
      <span className="text-xs font-semibold text-sky-600">{draft.toPinPlaced ? 'Edit' : 'Map'}</span>
    </button>
    <div className={`${EXPLORE_FLOW.choiceGrid2}`}>
      {([
        { key: 'flexible' as const, title: 'Flexible', subtitle: 'Rough window OK' },
        { key: 'specific' as const, title: 'Fixed', subtitle: 'Need this time' },
      ]).map((option) => {
        const active = draft.destinationTimeMode === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => patchDraft({ destinationTimeMode: option.key })}
            className={exploreFlowChoiceCardClass(active)}
          >
            <p className={EXPLORE_FLOW.choiceCardTitle}>{option.title}</p>
            <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
          </button>
        );
      })}
    </div>
    {draft.destinationTimeMode === 'specific' ? (
      <label className="mt-4 block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Arrival time
        </span>
        <input
          type="time"
          value={draft.destinationTime}
          onChange={(event) => patchDraft({ destinationTime: event.target.value })}
          className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base font-semibold text-gray-900"
        />
      </label>
    ) : null}
  </>
);
