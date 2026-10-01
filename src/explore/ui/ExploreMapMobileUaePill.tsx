import { createPortal } from 'react-dom';
import { useId, useState } from 'react';
import { Check } from 'lucide-react';
import { getVenueStateFilterOptions } from '../../config/regions';
import { UaeFlagIcon } from '../../components/ui/UaeFlagIcon';
import { useExploreMapPillDropdown } from './exploreMapPillDropdown';

type ExploreMapMobileUaePillProps = {
  venueRegions: string[];
  onVenueRegionsChange: (regions: string[]) => void;
  pillClassName: string;
  onOpen?: () => void;
};

/** UAE emirates — multi-select dropdown (not a second pill row). */
export const ExploreMapMobileUaePill = ({
  venueRegions,
  onVenueRegionsChange,
  pillClassName,
  onOpen,
}: ExploreMapMobileUaePillProps) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { anchorRef, menuRef, menuStyle } = useExploreMapPillDropdown({
    open,
    onOpenChange: setOpen,
    minWidthPx: 220,
  });
  const options = getVenueStateFilterOptions();
  const active = venueRegions.length > 0;

  const toggle = (key: string) => {
    onVenueRegionsChange(
      venueRegions.includes(key) ? venueRegions.filter((region) => region !== key) : [...venueRegions, key]
    );
  };

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            id={panelId}
            role="listbox"
            aria-label="Filter places by emirate"
            aria-multiselectable="true"
            style={menuStyle}
            className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white py-1 shadow-[0_12px_40px_rgba(15,23,42,.18)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-3.5 py-2">
              <span className="text-xs font-semibold text-neutral-600">Emirates</span>
              {active ? (
                <button
                  type="button"
                  onClick={() => onVenueRegionsChange([])}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Clear
                </button>
              ) : null}
            </div>
            {options.map((option) => {
              const selected = venueRegions.includes(option.key);
              return (
                <button
                  key={option.key}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => toggle(option.key)}
                  className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${
                    selected ? 'bg-emerald-50 text-emerald-950' : 'text-neutral-950 hover:bg-neutral-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {selected ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={anchorRef} className="relative shrink-0">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => {
            const next = !value;
            if (next) onOpen?.();
            return next;
          });
        }}
        className={pillClassName}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={panelId}
        aria-label={
          active ? `UAE, ${venueRegions.length} emirates selected` : 'UAE emirates'
        }
      >
        <UaeFlagIcon />
        <span>UAE</span>
        {active ? (
          <span className="text-sm font-bold leading-none">({venueRegions.length})</span>
        ) : null}
      </button>
      {menu}
    </div>
  );
};
