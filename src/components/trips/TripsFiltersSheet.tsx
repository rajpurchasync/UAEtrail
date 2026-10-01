import { SlidersHorizontal, Target } from 'lucide-react';
import type { TripsSavedLayer, TripsSegment } from '../../trips/tripsRouting';
import { ConsumerBottomSheet } from '../mobile/ConsumerBottomSheet';
import { FilterChips } from '../mobile/FilterChips';

type TripsFiltersSheetProps = {
  open: boolean;
  onClose: () => void;
  segment: TripsSegment;
  hasActiveGoal: boolean;
  savedLayer: TripsSavedLayer;
  onSavedLayerChange: (layer: TripsSavedLayer) => void;
  onOpenGoal: () => void;
};

/** Extra trips filters — saved places/shops and outdoor goal (role pills live on the toolbar). */
export const TripsFiltersSheet = ({
  open,
  onClose,
  segment,
  hasActiveGoal,
  savedLayer,
  onSavedLayerChange,
  onOpenGoal,
}: TripsFiltersSheetProps) => {
  return (
    <ConsumerBottomSheet open={open} title="More filters" onClose={onClose}>
      <div className="space-y-5 px-1 pb-2">
        {segment === 'wishlist' ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2">Saved on map</p>
            <FilterChips
              variant="brand"
              options={[
                { key: 'trips', label: 'Plans' },
                { key: 'places', label: 'Places' },
                { key: 'shops', label: 'Shops' },
              ]}
              value={savedLayer}
              onChange={onSavedLayerChange}
            />
          </div>
        ) : (
          <p className="text-sm text-neutral-600">
            Open <strong>Wishlist</strong> to filter saved plans, places, and shops.
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenGoal();
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3.5 text-left active:scale-[0.99]"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"
            aria-hidden
          >
            <Target className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-900">
              {hasActiveGoal ? 'Your outdoor goal' : 'Set an outdoor goal'}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {hasActiveGoal ? 'View progress or adjust your target' : 'Optional — check-ins on joined trips count'}
            </p>
          </div>
        </button>
      </div>
    </ConsumerBottomSheet>
  );
};

const filterTriggerClass =
  'touch-target-icon inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200/90 bg-white text-neutral-600 shadow-sm active:scale-[0.98]';

type TripsFilterTriggerProps = {
  active: boolean;
  onClick: () => void;
};

export const TripsFilterTrigger = ({ active, onClick }: TripsFilterTriggerProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`${filterTriggerClass} relative ${active ? 'ring-2 ring-emerald-500/40' : ''}`}
    aria-label="Filter trips"
    title="Filter"
  >
    <SlidersHorizontal className="h-5 w-5" strokeWidth={2.25} aria-hidden />
  </button>
);
