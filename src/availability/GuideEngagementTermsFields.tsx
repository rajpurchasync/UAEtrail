import { Link, useLocation } from 'react-router-dom';
import type { AvailabilityEngagementTerms, AvailabilityTourShape } from '@uaetrail/shared-types';
import {
  AVAILABILITY_PRICING_KINDS,
  AVAILABILITY_TOUR_SHAPES,
} from '@uaetrail/shared-types';
import { proMembershipPath } from '../config/routingCatalog';
import { UPL_PRO_MEMBERSHIP } from '../content/upl-glossary';

const PRICING_LABELS: Record<(typeof AVAILABILITY_PRICING_KINDS)[number], string> = {
  free: 'Free',
  paid: 'Paid rate',
  upon_request: 'Price on request',
};

const TOUR_SHAPE_LABELS: Record<AvailabilityTourShape, string> = {
  private: 'Private',
  group: 'Group',
  either: 'Private or group',
};

export type GuideEngagementTermsFieldsProps = {
  value: AvailabilityEngagementTerms;
  onChange: (next: AvailabilityEngagementTerms) => void;
  canHostPaidActivities: boolean;
};

export const GuideEngagementTermsFields = ({
  value,
  onChange,
  canHostPaidActivities,
}: GuideEngagementTermsFieldsProps) => {
  const location = useLocation();
  const proHref = proMembershipPath({
    intent: 'add-guide',
    redirect: `${location.pathname}${location.search}`,
  });

  const setPricingKind = (pricingKind: AvailabilityEngagementTerms['pricingKind']) => {
    if (pricingKind === 'paid' && !canHostPaidActivities) return;
    onChange({
      ...value,
      pricingKind,
      rate: pricingKind === 'paid' ? value.rate ?? null : null,
    });
  };

  return (
    <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      <legend className="px-1 text-sm font-semibold text-slate-900">Guide terms</legend>
      <p className="text-xs text-slate-600">How you offer guide time — shown on Available rows when you publish as a guide.</p>

      <div className="flex flex-wrap gap-2">
        {AVAILABILITY_PRICING_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            disabled={kind === 'paid' && !canHostPaidActivities}
            onClick={() => setPricingKind(kind)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              value.pricingKind === kind
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-slate-700 ring-1 ring-slate-200'
            } ${kind === 'paid' && !canHostPaidActivities ? 'opacity-50' : ''}`}
            aria-pressed={value.pricingKind === kind}
          >
            {PRICING_LABELS[kind]}
          </button>
        ))}
      </div>

      {!canHostPaidActivities ? (
        <p className="text-xs text-slate-600">
          Paid rates require{' '}
          <Link to={proHref} className="font-semibold text-emerald-800 underline">
            {UPL_PRO_MEMBERSHIP}
          </Link>
          .
        </p>
      ) : null}

      {value.pricingKind === 'paid' ? (
        <label className="block text-sm font-medium text-slate-700">
          From (AED)
          <input
            type="number"
            min={1}
            step={1}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={value.rate ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                rate: e.target.value === '' ? null : Number(e.target.value),
              })
            }
            placeholder="e.g. 350"
          />
        </label>
      ) : null}

      <label className="block text-sm font-medium text-slate-700">
        Tour shape
        <select
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={value.tourShape ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              tourShape: (e.target.value || null) as AvailabilityTourShape | null,
            })
          }
        >
          <option value="">Optional</option>
          {AVAILABILITY_TOUR_SHAPES.map((shape) => (
            <option key={shape} value={shape}>
              {TOUR_SHAPE_LABELS[shape]}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium text-slate-700">
          Min group
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={value.minParticipants ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                minParticipants: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Max group
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={value.maxParticipants ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                maxParticipants: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
        </label>
      </div>
    </fieldset>
  );
};