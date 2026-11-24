import { EXPLORE_FLOW } from '../config/exploreTheme';
import { exploreFlowChoiceCardClass } from '../explore/ui/exploreFlowUi';
import {
  AVAILABILITY_FIXED_PARTY_PRESETS,
  AVAILABILITY_FIXED_VEHICLE_OPTIONS,
  type AvailabilityFixedTransportMode,
  type AvailabilityFixedVehicleType,
} from '../explore/ui/intentFixedFlowEngine';

export type AvailabilityOpenLogisticsState = {
  partySize: number;
  transportMode: AvailabilityFixedTransportMode | null;
  selfVehicleType: AvailabilityFixedVehicleType | null;
  rideshareSeatsNeeded: number;
};

type AvailabilityOpenLogisticsFieldsProps = {
  value: AvailabilityOpenLogisticsState;
  onChange: (patch: Partial<AvailabilityOpenLogisticsState>) => void;
};

/** Party + transport for open (flexible) availability — same UX as fixed intent. */
export const AvailabilityOpenLogisticsFields = ({ value, onChange }: AvailabilityOpenLogisticsFieldsProps) => (
  <>
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-slate-900">How many people</legend>
      <div className="flex flex-wrap gap-2">
        {AVAILABILITY_FIXED_PARTY_PRESETS.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onChange({ partySize: size })}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              value.partySize === size ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </fieldset>

    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-slate-900">Transport</legend>
      <p className="text-xs text-slate-600">How you plan to get to the meetup.</p>
      <div className={`${EXPLORE_FLOW.choiceGrid2} gap-2`}>
        {(
          [
            { key: 'self' as const, title: 'Have transport', subtitle: 'I can drive' },
            { key: 'rideshare' as const, title: 'Need carpool', subtitle: 'Looking for a ride' },
          ] as const
        ).map((option) => {
          const active = value.transportMode === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() =>
                onChange({
                  transportMode: option.key,
                  selfVehicleType: option.key === 'self' ? value.selfVehicleType ?? 'sedan' : null,
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
      {value.transportMode === 'self' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {AVAILABILITY_FIXED_VEHICLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ selfVehicleType: option.value })}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                value.selfVehicleType === option.value
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {option.title}
            </button>
          ))}
        </div>
      ) : null}
      {value.transportMode === 'rideshare' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((seats) => (
            <button
              key={seats}
              type="button"
              onClick={() => onChange({ rideshareSeatsNeeded: seats })}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                value.rideshareSeatsNeeded === seats
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {seats} seat{seats === 1 ? '' : 's'}
            </button>
          ))}
        </div>
      ) : null}
    </fieldset>
  </>
);