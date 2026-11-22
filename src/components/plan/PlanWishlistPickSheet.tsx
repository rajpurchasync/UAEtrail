import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { PlaceDTO } from '@uaetrail/shared-types';
import { EXPLORE_FLOW, EXPLORE_LIST_ROW, EXPLORE_Z } from '../../config/exploreTheme';
import { ExploreResponsiveSheet } from '../../explore/ui/ExploreResponsiveSheet';
import { FlowSheetHeader } from '../../explore/ui/ExploreFlowSheetChrome';
import { usePlaceRegistry } from '../../hooks/usePlaceRegistry';
import { useMeWishlist } from '../../hooks/useMeWishlist';
import { checkWishlistTarget, invalidateMeWishlistQueries } from '../../hooks/wishlistClientApi';
import { saveWishlistTarget } from '../../wishlist/saveWishlistTarget';
import { PLAN_WISHLIST_PICK_TITLE } from '../../plan/planAdd';

type PlanWishlistPickSheetProps = {
  open: boolean;
  onClose: () => void;
};

const matchesQuery = (label: string, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return label.toLowerCase().includes(q);
};

export const PlanWishlistPickSheet = ({ open, onClose }: PlanWishlistPickSheetProps) => {
  const queryClient = useQueryClient();
  const places = usePlaceRegistry({ enabled: open });
  const { items: saved } = useMeWishlist(open);
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [justSavedIds, setJustSavedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (open) return;
    setQuery('');
    setSavingId(null);
    setJustSavedIds(new Set());
  }, [open]);

  const savedPlaceIds = useMemo(() => {
    const ids = new Set(saved.map((row) => row.locationId).filter((id): id is string => Boolean(id)));
    for (const id of justSavedIds) ids.add(id);
    return ids;
  }, [justSavedIds, saved]);

  const venueRows = useMemo(
    () =>
      places.filter((row) => !savedPlaceIds.has(row.id) && matchesQuery(row.name, query)),
    [places, query, savedPlaceIds]
  );

  const saveVenue = async (row: PlaceDTO) => {
    setSavingId(row.id);
    try {
      const target = { locationId: row.id };
      const existing = await checkWishlistTarget(target);
      if (!existing.saved) await saveWishlistTarget({ kind: 'venue', locationId: row.id });
      setJustSavedIds((prev) => {
        const next = new Set(prev);
        next.add(row.id);
        return next;
      });
      invalidateMeWishlistQueries(queryClient);
    } finally {
      setSavingId(null);
    }
  };

  if (!open) return null;

  return (
    <ExploreResponsiveSheet
      open
      onClose={onClose}
      title={PLAN_WISHLIST_PICK_TITLE}
      maxWidthClass="lg:max-w-md"
      zClass={EXPLORE_Z.composeFlow}
      overlayFixed
      composePresentation="menu"
      viewportAdaptive
      showHandle={false}
      showCloseButton
      panelClassName="overflow-hidden px-0 pb-[calc(var(--safe-bottom)+1rem)] pt-0 lg:pb-8 lg:pt-3"
    >
      <FlowSheetHeader title={PLAN_WISHLIST_PICK_TITLE} onClose={onClose} pickerTitle />
      <div className="px-5">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          className={EXPLORE_FLOW.composeField}
          autoFocus
        />
        {venueRows.length > 0 ? (
          <ul className="mt-3 max-h-[min(50vh,24rem)] space-y-2 overflow-y-auto">
            {venueRows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  disabled={savingId === row.id}
                  onClick={() => void saveVenue(row)}
                  className={`${EXPLORE_LIST_ROW.shell} ${EXPLORE_LIST_ROW.main} w-full`}
                >
                  <span className={EXPLORE_LIST_ROW.title}>{row.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </ExploreResponsiveSheet>
  );
};
