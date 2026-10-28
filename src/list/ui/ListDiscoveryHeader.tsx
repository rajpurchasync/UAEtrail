import { PanelLeftClose, X } from 'lucide-react';

import type { ReactNode } from 'react';

import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

import { MobileMenuButton } from '../../components/layout/MobileMenu';
import { MobileBackButton } from '../../components/mobile/MobileBackButton';

import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../../explore/exploreBrowseTaxonomy';

import {
  BROWSE_LIST_FULL_SCREEN_CTA,
  BROWSE_LIST_MAP_CTA,
  LIST_DISCOVER_LOOKING_PROMPT,
} from '../browseListCopy';

import { LIST_CATEGORY_PAGE_TITLE } from '../listCategoryCopy';

import type { BrowseMainCategoryKey } from '../browseListTaxonomy';

import type { ListDiscoveryView } from '../listDiscoveryMode';

import { listDiscoveryEmbeddedOnExplore, type ListDiscoverySurface } from '../listDiscoverySurface';

import { EXPLORE_PEOPLE_BROWSE_DISCOVER_SEARCH_PLACEHOLDER } from '../../content/explorePeopleBrowseCopy';
import { LIST_APP_BAR, LIST_CHROME, LIST_DESKTOP_MAP_LINK } from '../listChromeTheme';

import { ListDiscoverySearchField } from './ListDiscoverySearchField';



interface ListDiscoveryHeaderProps {

  surface: ListDiscoverySurface;

  view: ListDiscoveryView;

  query: string;

  onQueryChange: (value: string) => void;

  onQuerySync?: () => void;

  onSearchCommit?: (scope?: ExploreSearchScopeKey | null) => void;

  onClearQuery?: () => void;

  searchScopeCounts: ExploreSearchScopeCounts;

  mapHref: string;

  onOpenRefine: () => void;

  categoryFocus?: BrowseMainCategoryKey | null;

  onBackFromCategory?: () => void;

  categoryBackLabel?: string;

  categoryBackFallbackTo?: string;

  categoryFilterRow?: ReactNode;

  searchActiveFiltersRow?: ReactNode;

  showMapLink?: boolean;

  fullScreenDiscoverHref?: string | null;

  onCloseMapOverlay?: () => void;

  closeVariant?: 'collapse' | 'dismiss';

  /** Shown under centered category title (e.g. “7 activities”). */
  categoryResultsLabel?: string | null;

  /** Parent sheet already renders full-screen back + title (mobile explore immersive). */
  overlayImmersive?: boolean;

}



export const ListDiscoveryHeader = ({

  surface,

  view,

  query,

  onQueryChange,

  onQuerySync,

  onSearchCommit,

  onClearQuery,

  searchScopeCounts,

  mapHref,

  onOpenRefine,

  categoryFocus = null,

  onBackFromCategory,

  categoryBackLabel = 'Back',

  categoryBackFallbackTo = '/list',

  categoryFilterRow = null,

  searchActiveFiltersRow = null,

  showMapLink = false,

  fullScreenDiscoverHref = null,

  onCloseMapOverlay,

  closeVariant = 'dismiss',

  categoryResultsLabel = null,

  overlayImmersive = false,

}: ListDiscoveryHeaderProps) => {

  const { user } = useAuth();

  const embeddedOnExplore = listDiscoveryEmbeddedOnExplore(surface);

  const mapOverlay = surface === 'mapOverlay';

  const exploreSidebar = surface === 'exploreSidebar';

  const showRefineBesideSearch = view === 'search';

  const isCategory = view === 'category';

  const isHome = view === 'home';

  const dedicatedCategoryChrome = Boolean(categoryFocus);
  const parentImmersiveChrome = mapOverlay && overlayImmersive;
  const peopleCategoryImmersive =
    parentImmersiveChrome && dedicatedCategoryChrome && categoryFocus === 'people';

  const topPad = mapOverlay

    ? 'pt-0.5'

    : exploreSidebar

      ? 'pt-0'

      : 'pt-[calc(var(--safe-top)+6px)] max-lg:pt-[calc(var(--safe-top)+6px)]';



  const closeButton = onCloseMapOverlay ? (

    <button

      type="button"

      onClick={onCloseMapOverlay}

      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 active:bg-neutral-100 focus:outline-none focus-visible:outline-none"

      aria-label={closeVariant === 'collapse' ? 'Collapse list panel' : 'Close discover panel'}

    >

      {closeVariant === 'collapse' ? (

        <PanelLeftClose className="h-5 w-5" aria-hidden />

      ) : (

        <X className="h-5 w-5" aria-hidden />

      )}

    </button>

  ) : null;

  const buddiesCategory = isCategory && categoryFocus === 'people';

  const searchField = (

    <ListDiscoverySearchField

      query={query}

      onQueryChange={onQueryChange}

      onQuerySync={onQuerySync}

      onSearchCommit={onSearchCommit}

      onClearQuery={onClearQuery}

      searchScopeCounts={searchScopeCounts}

      mapHref={mapHref}

      showRefine={showRefineBesideSearch}

      onOpenRefine={onOpenRefine}

      compactTop

      hideMapLink={isHome || dedicatedCategoryChrome ? true : !showMapLink}

      className="!mt-0"

      placeholder={buddiesCategory ? EXPLORE_PEOPLE_BROWSE_DISCOVER_SEARCH_PLACEHOLDER : undefined}

      enableScopeHints={!buddiesCategory}

    />

  );



  const chromeWidth = exploreSidebar ? 'w-full max-w-none px-0' : `${LIST_CHROME.maxWidth} ${LIST_CHROME.horizontalPad}`;



  if (peopleCategoryImmersive) {
    return null;
  }

  return (

    <div
      className={`relative z-30 shrink-0 ${LIST_CHROME.chromeBg} ${isHome ? '' : LIST_CHROME.chromeBorder} ${topPad}`}
    >

      <div

        className={`${chromeWidth} ${

          isHome
            ? 'space-y-2.5 pb-2'
            : dedicatedCategoryChrome || view === 'search'
              ? 'space-y-3 pb-3'
              : 'pb-3'

        }`}

      >

        {categoryFocus && onBackFromCategory && !parentImmersiveChrome ? (

          <div className={`grid grid-cols-[minmax(72px,auto)_1fr_2.5rem] items-center gap-1 ${mapOverlay ? 'min-h-10' : 'min-h-11'}`}>

            <MobileBackButton
              label={categoryBackLabel}
              fallbackTo={categoryBackFallbackTo}
              onPress={onBackFromCategory}
              className="-ml-1 text-neutral-900"
            />

            <div className="min-w-0 px-1 text-center">

              <h2 className="truncate text-lg font-bold leading-tight tracking-tight text-neutral-900">

                {LIST_CATEGORY_PAGE_TITLE[categoryFocus]}

              </h2>

              {categoryResultsLabel ? (

                <p className="mt-0.5 truncate text-xs font-semibold tabular-nums text-neutral-600">

                  {categoryResultsLabel}

                </p>

              ) : null}

            </div>

            <div className="flex items-center justify-end">

              {embeddedOnExplore ? closeButton : (

                <MobileMenuButton tone="default" showOnDesktop className={LIST_CHROME.menuButton} />

              )}

            </div>

          </div>

        ) : isHome ? (

          <>

            {!parentImmersiveChrome ? (
              <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-1 min-h-10">

                <span className="w-10 shrink-0" aria-hidden />

                <h2 className="min-w-0 px-1 text-center text-lg font-bold leading-tight tracking-tight text-neutral-900">

                  {LIST_DISCOVER_LOOKING_PROMPT}

                </h2>

                <div className="flex items-center justify-end">

                  {embeddedOnExplore ? closeButton : (
                    <MobileMenuButton tone="default" showOnDesktop className={LIST_CHROME.menuButton} />
                  )}

                </div>

              </div>
            ) : null}

            {searchField}

            {embeddedOnExplore && fullScreenDiscoverHref ? (
              <Link
                to={fullScreenDiscoverHref}
                className="block text-center text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {BROWSE_LIST_FULL_SCREEN_CTA}
              </Link>
            ) : null}

          </>

        ) : embeddedOnExplore && !categoryFocus && !parentImmersiveChrome ? (

          <div className="flex justify-end gap-1">{closeButton}</div>

        ) : !embeddedOnExplore && user ? (

          <div className={`${LIST_APP_BAR.row} min-h-9 justify-end`}>

            <MobileMenuButton tone="default" showOnDesktop className={LIST_CHROME.menuButton} />

          </div>

        ) : null}



        {view === 'search' ? searchField : null}

        {dedicatedCategoryChrome && categoryFocus !== 'people' && view === 'category' ? searchField : null}



        {searchActiveFiltersRow}



        {categoryFilterRow}



        {showMapLink && !dedicatedCategoryChrome && !embeddedOnExplore && !isHome ? (

          <Link to={mapHref} className={`${LIST_DESKTOP_MAP_LINK} mt-2 hidden md:inline-flex`}>

            {BROWSE_LIST_MAP_CTA}

          </Link>

        ) : null}

      </div>

    </div>

  );

};


