import { useCallback, useEffect, useMemo, useState } from 'react';
import { Map } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { PageMeta } from '../seo/PageMeta';
import { useMinWidthMd } from '../../hooks/useMinWidthMd';
import { useMinWidthPx } from '../../hooks/useMinWidthPx';
import { useExploreMap } from '../../hooks/useExploreMap';
import { GuestFeatureUnlockPanel } from '../../explore/ui/GuestFeatureUnlockPanel';
import type { GuestFeatureUnlockKey } from '../../content/guestFeatureUnlockCopy';
import { APP_PAGE_MIN_H_CLASS } from '../../config/layoutScroll';
import { collapseDesktopSideNav } from '../../hooks/useDesktopSideNavExpanded';
import {
  GUEST_GATED_MAP_OPEN_STORAGE_KEY,
  GUEST_GATED_THREE_COLUMN_MIN_PX,
} from './guestGatedLayout';
import { GuestPreviewCatalogList } from './GuestPreviewCatalogList';
import { GuestPreviewMapColumn } from './GuestPreviewMapColumn';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';

type GuestGatedSurfaceLayoutProps = {
  title: string;
  feature: GuestFeatureUnlockKey;
  authReturnPath?: string;
  authFocusSelector?: string;
};

const readMapColumnOpen = (): boolean => {
  try {
    return sessionStorage.getItem(GUEST_GATED_MAP_OPEN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const writeMapColumnOpen = (open: boolean) => {
  try {
    sessionStorage.setItem(GUEST_GATED_MAP_OPEN_STORAGE_KEY, open ? '1' : '0');
  } catch {
    /* ignore */
  }
};

/**
 * Member-only route for guests — members context + unlock rail + optional preview map (wide).
 */
export const GuestGatedSurfaceLayout = ({
  title,
  feature,
  authReturnPath,
  authFocusSelector,
}: GuestGatedSurfaceLayoutProps) => {
  const location = useLocation();
  const desktopPopup = useMinWidthMd();
  const wideThreeColumn = useMinWidthPx(GUEST_GATED_THREE_COLUMN_MIN_PX);
  const [mapColumnOpen, setMapColumnOpen] = useState(readMapColumnOpen);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: mapItems = [] } = useExploreMap({ enabled: desktopPopup });

  const returnPath = authReturnPath ?? `${location.pathname}${location.search}`;
  const showMapColumn = desktopPopup && (wideThreeColumn || mapColumnOpen);
  const showContextColumn = desktopPopup && (!mapColumnOpen || wideThreeColumn);
  const showMapPrompt = desktopPopup && !wideThreeColumn && !mapColumnOpen;

  const previewItems = useMemo(
    () => mapItems.filter((item) => item.latitude != null && item.longitude != null).slice(0, 6),
    [mapItems]
  );

  const openMapColumn = useCallback(() => {
    collapseDesktopSideNav();
    setMapColumnOpen(true);
    writeMapColumnOpen(true);
  }, []);

  useEffect(() => {
    if (wideThreeColumn) {
      setMapColumnOpen(false);
      writeMapColumnOpen(false);
    }
  }, [wideThreeColumn]);

  const handleSelectItem = useCallback((item: ExploreMapItemDTO) => {
    setSelectedId(item.id);
    setHighlightedId(item.id);
  }, []);

  return (
    <div
      className={`flex flex-col ${APP_PAGE_MIN_H_CLASS} bg-neutral-50 max-md:pb-bottom-nav-safe md:flex-row md:items-stretch`}
    >
      <PageMeta title={title} noIndex />
      {showContextColumn ? (
        <div className="hidden min-h-0 flex-1 flex-col justify-center self-stretch px-10 py-12 md:flex lg:px-14">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Members</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">{title}</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600">
            Create a free account to use this space. Your sidebar stays — sign up or log in on the right when
            you&apos;re ready.
          </p>
        </div>
      ) : null}
      <aside
        className={`flex min-h-0 flex-col self-stretch border-t border-neutral-200 bg-white md:flex-none md:shrink-0 md:border-l md:border-t-0 md:shadow-[-12px_0_32px_rgba(15,23,42,0.08)] ${
          showMapColumn && !wideThreeColumn
            ? 'w-full min-w-0 flex-1 md:w-[min(360px,38vw)]'
            : 'w-full flex-1 md:w-[min(400px,32vw)]'
        }`}
        aria-label={`${title} — sign up to continue`}
      >
        <div className="border-b border-neutral-100 px-5 py-4 md:hidden">
          <h1 className="text-lg font-bold text-neutral-900">{title}</h1>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain scroll-touch px-5 py-8 md:px-6 md:py-10">
          {showMapPrompt ? (
            <button
              type="button"
              onClick={openMapColumn}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
            >
              <Map className="h-4 w-4 shrink-0" aria-hidden />
              Show preview map
            </button>
          ) : null}
          <div className={`${showMapColumn ? 'max-w-none' : 'mx-auto my-auto w-full min-w-0 max-w-sm'}`}>
            <GuestFeatureUnlockPanel
              feature={feature}
              presentation={desktopPopup ? 'dialog' : 'card'}
              authReturnPath={returnPath}
              authFocusSelector={authFocusSelector}
            />
            {showMapColumn ? (
              <GuestPreviewCatalogList
                items={previewItems}
                highlightedId={highlightedId}
                selectedId={selectedId}
                onHighlight={setHighlightedId}
                onSelect={handleSelectItem}
              />
            ) : null}
          </div>
        </div>
      </aside>
      {showMapColumn ? (
        <GuestPreviewMapColumn
          highlightedExploreItemId={highlightedId}
          selectedExploreItemId={selectedId}
          onSelectItem={handleSelectItem}
        />
      ) : null}
    </div>
  );
};
