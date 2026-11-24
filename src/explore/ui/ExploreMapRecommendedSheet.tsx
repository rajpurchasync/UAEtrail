import { useCallback, useId } from 'react';
import type { DiscoverRecommendationSignal, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../../discovery';
import {
  EXPLORE_MAP_RECOMMENDED_SHEET_LIMIT,
  EXPLORE_MAP_RECOMMENDED_TITLE,
  EXPLORE_MAP_RECOMMENDED_VIEW_ALL_LABEL,
} from '../recommend/exploreRecommendCopy';
import { exploreSheetPanelClass } from '../../config/exploreTheme';
import { CONSUMER_SURFACE_TYPE } from '../../config/consumerSurfaceTypography';
import { SHEET_DRAG_HANDLE_ATTR, useSheetDragDismiss } from '../../hooks/useSheetDragDismiss';
import { ExploreMapRecommendationRow } from './ExploreMapRecommendationRow';

export { RecommendationSignalChips } from './RecommendationSignalChips';

export type ExploreMapRecommendedSheetSnap = 'hidden' | 'half' | 'expanded';

type ExploreMapRecommendedSheetProps = {
  items: ExploreMapItemDTO[];
  snap: ExploreMapRecommendedSheetSnap;
  onSnapChange: (snap: ExploreMapRecommendedSheetSnap) => void;
  onOpenItem: (itemId: string) => void;
  onOpenList?: () => void;
  signalsByItemId?: Map<string, DiscoverRecommendationSignal[]>;
};

/** Sheet flush to screen bottom; scroll pad clears tab bar when expanded. */
const MAP_SHEET_ANCHOR = 'bottom-0 md:bottom-4';

const MAP_SHEET_SCROLL_PAD =
  'pb-[calc(var(--bottom-nav-chrome-height,56px)+var(--safe-bottom,0px)+0.5rem)] md:pb-[max(0.75rem,var(--safe-bottom,0px))]';

/** Half snap hugs card stack; only grows toward half viewport when content needs it. */
const HALF_HEIGHT_CAP =
  'max-h-[min(50dvh,calc(100dvh-var(--explore-browse-peek-top)))]';

/**
 * Map recommendation tray — edge-to-edge on mobile; browse-style row cards.
 */
export const ExploreMapRecommendedSheet = ({
  items,
  snap,
  onSnapChange,
  onOpenItem,
  onOpenList,
  signalsByItemId,
}: ExploreMapRecommendedSheetProps) => {
  const titleId = useId();
  const visibleItems = items.slice(0, EXPLORE_MAP_RECOMMENDED_SHEET_LIMIT);

  const handleDragDismiss = useCallback(() => {
    if (snap === 'expanded') {
      onSnapChange('half');
      return false;
    }
    onSnapChange('hidden');
  }, [onSnapChange, snap]);

  const dragEnabled = snap !== 'hidden' && visibleItems.length > 0;
  const { panelRef: dragPanelRef, panelStyle, dragZoneProps } = useSheetDragDismiss(handleDragDismiss, {
    enabled: dragEnabled,
    mode: snap === 'half' ? 'peek' : 'default',
    onExpand: snap === 'half' ? () => onSnapChange('expanded') : undefined,
  });

  const mergePanelRef = (node: HTMLDivElement | null) => {
    dragPanelRef.current = node;
  };

  if (visibleItems.length === 0) return null;

  if (snap === 'hidden') {
    return (
      <button
        type="button"
        onClick={() => onSnapChange('half')}
        className="pointer-events-auto absolute bottom-[calc(var(--bottom-nav-chrome-height,56px)+var(--safe-bottom,0px)+8px)] left-1/2 z-[1095] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-emerald-800 shadow-lg ring-1 ring-emerald-200/80 md:bottom-4 md:left-6 md:translate-x-0"
      >
        {EXPLORE_MAP_RECOMMENDED_TITLE}
      </button>
    );
  }

  const expanded = snap === 'expanded';

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-[1095] flex justify-stretch ${MAP_SHEET_ANCHOR} ${
        expanded ? 'top-[var(--explore-browse-peek-top)]' : ''
      } md:justify-start md:px-4`}
    >
      <div
        ref={mergePanelRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        style={panelStyle}
        className={`pointer-events-auto flex w-full flex-col overflow-hidden rounded-b-none border-neutral-200/80 bg-neutral-50 shadow-[0_-12px_48px_rgba(15,23,42,.18)] transition-[height] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] md:max-w-md ${exploreSheetPanelClass} ${
          expanded ? 'h-full max-h-full min-h-0' : `h-auto ${HALF_HEIGHT_CAP}`
        }`}
      >
        <div
          className="flex w-full shrink-0 touch-none select-none flex-col gap-1 border-b border-emerald-200/60 bg-gradient-to-b from-emerald-50/90 to-white px-4 pb-2 pt-1.5"
          aria-label={
            snap === 'expanded'
              ? 'Drag down for half screen'
              : 'Drag down to close or drag up for full screen'
          }
          {...dragZoneProps}
          {...{ [SHEET_DRAG_HANDLE_ATTR]: true }}
        >
          <div className="sheet-drag-handle-bar shrink-0 self-center" aria-hidden />
          <h2 id={titleId} className={`${CONSUMER_SURFACE_TYPE.sheetTitle} text-emerald-950`}>
            {EXPLORE_MAP_RECOMMENDED_TITLE}
          </h2>
        </div>

        <div
          className={`${
            expanded ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-touch' : ''
          } ${MAP_SHEET_SCROLL_PAD}`}
        >
          <ul className="flex flex-col gap-2.5 px-3 pt-3">
            {visibleItems.map((item) => {
              const card = buildDiscoveryCardViewModelCard(item);
              const signals = signalsByItemId?.get(item.id) ?? [];
              return (
                <li key={item.id}>
                  <ExploreMapRecommendationRow
                    card={card}
                    signals={signals}
                    onOpen={() => onOpenItem(item.id)}
                  />
                </li>
              );
            })}
            {onOpenList ? (
              <li className="pt-0.5">
                <button
                  type="button"
                  onClick={onOpenList}
                  className="w-full rounded-lg py-2.5 text-center text-sm font-semibold text-emerald-800/90 underline-offset-2 transition active:text-emerald-950 hover:underline"
                >
                  {EXPLORE_MAP_RECOMMENDED_VIEW_ALL_LABEL}
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
};