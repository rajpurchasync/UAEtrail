import { createPortal } from 'react-dom';
import { useId, useState } from 'react';
import { Check, MapPin } from 'lucide-react';
import { EXPLORE_MAP_MOBILE_FLOAT_CHIP_MARK } from '../../config/exploreTheme';
import { EXPLORE_REGION_SCOPE_RESTING_LABEL } from '../exploreOptionalFilters';
import { useVenueStateFilterOptions } from '../../config/useVenueStateFilterOptions';
import { UiTooltip } from '../../components/ui/UiTooltip';
import { UaeFlagIcon } from '../../components/ui/UaeFlagIcon';
import { ExploreMapFilterMenuShell } from './ExploreMapFilterMenuShell';
import { useExploreMapPillDropdown } from './exploreMapPillDropdown';

type ExploreMapMobileUaePillProps = {
  venueRegions: string[];
  onVenueRegionsChange: (regions: string[]) => void;
  pillClassName: string;
  compact?: boolean;
  wrapClassName?: string;
  triggerFullWidth?: boolean;
  onOpen?: () => void;
  /** Default trigger label when no emirate selected (list uses “State”). */
  restingLabel?: string;
};

/** UAE emirates — multi-select dropdown (not a second pill row). */
export const ExploreMapMobileUaePill = ({
  venueRegions,
  onVenueRegionsChange,
  pillClassName,
  compact = false,
  wrapClassName = 'relative flex min-w-0 flex-1 basis-0',
  triggerFullWidth = true,
  onOpen,
  restingLabel: restingLabelProp,
}: ExploreMapMobileUaePillProps) => {
  const scopeRestingLabel = restingLabelProp ?? EXPLORE_REGION_SCOPE_RESTING_LABEL;
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { anchorRef, menuRef, menuStyle, caretLeftPx } = useExploreMapPillDropdown({
    open,
    onOpenChange: setOpen,
    minWidthPx: 220,
    showCaret: true,
  });
  const options = useVenueStateFilterOptions();
  const active = venueRegions.length > 0;

  const toggle = (key: string) => {
    onVenueRegionsChange(
      venueRegions.includes(key) ? venueRegions.filter((region) => region !== key) : [...venueRegions, key]
    );
  };

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <ExploreMapFilterMenuShell
            menuRef={menuRef}
            menuStyle={menuStyle}
            caretLeftPx={caretLeftPx}
            label="Where"
            icon={<MapPin className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
            extraListProps={{
              id: panelId,
              role: 'listbox',
              'aria-label': 'Filter places by emirate',
              'aria-multiselectable': 'true',
            }}
          >
            <div className="flex items-center justify-between gap-2 px-3.5 pb-1 pt-0.5">
              <span className="text-[12px] font-semibold text-neutral-500">Emirates</span>
              {active ? (
                <button
                  type="button"
                  onClick={() => onVenueRegionsChange([])}
                  className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700"
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
          </ExploreMapFilterMenuShell>,
          document.body
        )
      : null;

  const selectedLabels = options
    .filter((option) => venueRegions.includes(option.key))
    .map((option) => option.label);
  const triggerLabel =
    selectedLabels.length === 1
      ? selectedLabels[0]
      : selectedLabels.length > 1
        ? `${scopeRestingLabel} (${selectedLabels.length})`
        : scopeRestingLabel;
  const uaeLabel = active
    ? `${scopeRestingLabel}, ${venueRegions.length} selected`
    : scopeRestingLabel;
  const trigger = (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        const next = !open;
        setOpen(next);
        if (next) onOpen?.();
      }}
      className={`${triggerFullWidth ? 'w-full' : 'w-auto'} ${pillClassName} ${
        open ? 'bg-white shadow-sm ring-1 ring-sky-400/70' : ''
      }`}
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={panelId}
      aria-label={uaeLabel}
    >
      {compact ? (
        <span className="inline-flex items-center gap-1">
          <span
            className={`explore-filter-mark ${EXPLORE_MAP_MOBILE_FLOAT_CHIP_MARK} explore-filter-mark--uae-flag`}
            aria-hidden
          >
            <UaeFlagIcon className="explore-map-float-chip-uae-flag shrink-0" aria-hidden />
          </span>
          {active ? (
            <span className="text-[12px] font-semibold leading-none tabular-nums">
              {venueRegions.length}
            </span>
          ) : null}
        </span>
      ) : (
        <>
          <span
            className={`explore-filter-mark ${EXPLORE_MAP_MOBILE_FLOAT_CHIP_MARK} explore-filter-mark--uae-flag`}
            aria-hidden
          >
            <UaeFlagIcon className="explore-map-float-chip-uae-flag shrink-0" aria-hidden />
          </span>
          <span className="max-w-[7.5rem] truncate">{triggerLabel}</span>
        </>
      )}
    </button>
  );

  return (
    <div ref={anchorRef} className={wrapClassName}>
      {compact ? (
        <UiTooltip label={uaeLabel} className="flex min-w-0 flex-1">
          {trigger}
        </UiTooltip>
      ) : (
        trigger
      )}
      {menu}
    </div>
  );
};
