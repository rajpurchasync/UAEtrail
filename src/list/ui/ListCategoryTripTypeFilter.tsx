import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { DEMAND_EMOJI } from '../../explore/exploreCopy';
import { ExploreFilterIcon } from '../../explore/ui/ExploreFilterIcon';
import {
  BROWSE_TRIP_PLAN_TYPE_OPTIONS,
  browseTripPlanTypeToState,
  resolveBrowseTripPlanType,
  type BrowseTripPlanTypeKey,
} from '../browseListTripTopics';
import { listCategoryPillClass } from '../listChromeTheme';

import type { BrowseTripTopicKey } from '../browseListTripTopics';

interface ListCategoryTripTypeFilterProps {
  tripTopics: BrowseTripTopicKey[];
  tripLookingOnly: boolean;
  onChange: (patch: { tripTopics: BrowseTripTopicKey[]; tripLookingOnly: boolean }) => void;
}

const OptionEmoji = ({ planType }: { planType: BrowseTripPlanTypeKey }) => {
  if (planType === 'looking') {
    return (
      <span className="font-emoji text-base leading-none" aria-hidden>
        {DEMAND_EMOJI}
      </span>
    );
  }
  if (planType === 'hiking' || planType === 'camping' || planType === 'rideshare') {
    return <ExploreFilterIcon filter={planType} context="activity" />;
  }
  return null;
};

/** Trips — plan type as text + dropdown (hiking · camping · rideshare · looking for). */
export const ListCategoryTripTypeFilter = ({
  tripTopics,
  tripLookingOnly,
  onChange,
}: ListCategoryTripTypeFilterProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const selected = resolveBrowseTripPlanType(tripTopics, tripLookingOnly);
  const active = selected !== 'all';
  const triggerLabel =
    BROWSE_TRIP_PLAN_TYPE_OPTIONS.find((o) => o.key === selected)?.label.toLowerCase() ?? 'all types';

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  const pick = (key: BrowseTripPlanTypeKey) => {
    onChange(browseTripPlanTypeToState(key));
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={listCategoryPillClass(active)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="listbox"
        aria-label={active ? `Type: ${triggerLabel}` : 'Filter by plan type'}
      >
        <span className="max-w-[6.5rem] truncate">{triggerLabel}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" strokeWidth={2.25} aria-hidden />
      </button>

      {open ? (
        <div
          id={panelId}
          role="listbox"
          aria-label="Filter plans by type"
          className="absolute left-0 top-[calc(100%+0.5rem)] z-[3100] min-w-[12.5rem]"
        >
          <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white py-1 shadow-[0_12px_40px_rgba(15,23,42,.18)]">
            {BROWSE_TRIP_PLAN_TYPE_OPTIONS.map((option) => {
              const isSelected = option.key === selected;
              return (
                <button
                  key={option.key}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => pick(option.key)}
                  className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${
                    isSelected ? 'bg-emerald-50 text-emerald-950' : 'text-neutral-950 hover:bg-neutral-50'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {option.key !== 'all' ? <OptionEmoji planType={option.key} /> : null}
                    <span>{option.label}</span>
                  </span>
                  {isSelected ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
