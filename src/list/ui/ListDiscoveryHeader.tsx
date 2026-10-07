import { ChevronLeft, Map, PanelLeftClose, X } from 'lucide-react';

import type { ReactNode } from 'react';

import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

import { MobileMenuButton } from '../../components/layout/MobileMenu';

import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../../explore/exploreBrowseTaxonomy';

import { BROWSE_LIST_MAP_CTA, LIST_DISCOVER_LOOKING_PROMPT } from '../browseListCopy';

import { LIST_CATEGORY_PAGE_TITLE } from '../listCategoryCopy';

import type { BrowseMainCategoryKey } from '../browseListTaxonomy';

import type { ListDiscoveryView } from '../listDiscoveryMode';

import { listDiscoveryEmbeddedOnExplore, type ListDiscoverySurface } from '../listDiscoverySurface';

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

  categoryFilterRow?: ReactNode;

  searchActiveFiltersRow?: ReactNode;

  showMapLink?: boolean;

  onCloseMapOverlay?: () => void;

  closeVariant?: 'collapse' | 'dismiss';

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

  categoryFilterRow = null,

  searchActiveFiltersRow = null,

  showMapLink = false,

  onCloseMapOverlay,

  closeVariant = 'dismiss',

}: ListDiscoveryHeaderProps) => {

  const { user } = useAuth();

  const embeddedOnExplore = listDiscoveryEmbeddedOnExplore(surface);

  const mapOverlay = surface === 'mapOverlay';

  const exploreSidebar = surface === 'exploreSidebar';

  const showRefineBesideSearch = view === 'search';

  const isCategory = view === 'category';

  const isHome = view === 'home';

  const topPad = mapOverlay

    ? 'pt-0.5'

    : exploreSidebar

      ? 'pt-0'

      : 'pt-[calc(var(--safe-top)+6px)] max-lg:pt-[calc(var(--safe-top)+6px)]';



  const closeButton = onCloseMapOverlay ? (

    <button

      type="button"

      onClick={onCloseMapOverlay}

      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 active:bg-neutral-100"

      aria-label={closeVariant === 'collapse' ? 'Collapse list panel' : 'Close discover panel'}

    >

      {closeVariant === 'collapse' ? (

        <PanelLeftClose className="h-5 w-5" aria-hidden />

      ) : (

        <X className="h-5 w-5" aria-hidden />

      )}

    </button>

  ) : null;



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

      hideMapLink={mapOverlay ? false : !showMapLink}

      className="!mt-0"

    />

  );



  const chromeWidth = exploreSidebar ? 'w-full max-w-none px-0' : `${LIST_CHROME.maxWidth} ${LIST_CHROME.horizontalPad}`;



  return (

    <div
      className={`relative z-30 shrink-0 ${LIST_CHROME.chromeBg} ${isHome ? '' : LIST_CHROME.chromeBorder} ${topPad}`}
    >

      <div

        className={`${chromeWidth} ${

          isHome ? 'space-y-2.5 pb-2' : isCategory ? (mapOverlay ? 'space-y-2 pb-1.5' : 'pb-2.5') : 'pb-3'

        }`}

      >

        {isCategory && categoryFocus && onBackFromCategory ? (

          <div className={`${LIST_APP_BAR.row} ${mapOverlay ? 'min-h-10' : 'min-h-11'} items-center gap-1`}>

            <button

              type="button"

              onClick={onBackFromCategory}

              className="flex min-w-0 flex-1 items-center gap-0.5 text-left active:opacity-80"

            >

              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full active:bg-neutral-100">

                <ChevronLeft className="h-6 w-6 text-neutral-900" aria-hidden />

              </span>

              <span className="truncate text-lg font-bold tracking-tight text-neutral-900">

                {LIST_CATEGORY_PAGE_TITLE[categoryFocus]}

              </span>

            </button>

            <div className="flex shrink-0 items-center gap-1">

              {showMapLink ? (

                <Link

                  to={mapHref}

                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-900 active:scale-95 md:hidden"

                  aria-label={BROWSE_LIST_MAP_CTA}

                >

                  <Map className="h-[18px] w-[18px] text-emerald-600" aria-hidden />

                </Link>

              ) : null}

              {embeddedOnExplore ? closeButton : null}

              {!embeddedOnExplore ? (

                <MobileMenuButton tone="default" showOnDesktop className={LIST_CHROME.menuButton} />

              ) : null}

            </div>

          </div>

        ) : isHome ? (

          <>

            {embeddedOnExplore ? (

              <div className="flex items-center gap-2">

                <h2 className="min-w-0 flex-1 text-left text-lg font-bold leading-tight tracking-tight text-neutral-900">

                  {LIST_DISCOVER_LOOKING_PROMPT}

                </h2>

                {closeButton}

              </div>

            ) : (

              <>

                {user ? (

                  <div className="flex justify-end">

                    <MobileMenuButton tone="default" showOnDesktop className={LIST_CHROME.menuButton} />

                  </div>

                ) : null}

                <h2 className="text-left text-lg font-bold leading-tight tracking-tight text-neutral-900">

                  {LIST_DISCOVER_LOOKING_PROMPT}

                </h2>

              </>

            )}

            {searchField}

          </>

        ) : embeddedOnExplore ? (

          <div className="flex justify-end">{closeButton}</div>

        ) : !embeddedOnExplore && user ? (

          <div className={`${LIST_APP_BAR.row} min-h-9 justify-end`}>

            <MobileMenuButton tone="default" showOnDesktop className={LIST_CHROME.menuButton} />

          </div>

        ) : null}



        {!isHome ? searchField : null}



        {searchActiveFiltersRow}



        {categoryFilterRow}



        {showMapLink && !isCategory && !embeddedOnExplore && !isHome ? (

          <Link to={mapHref} className={`${LIST_DESKTOP_MAP_LINK} mt-2 hidden md:inline-flex`}>

            {BROWSE_LIST_MAP_CTA}

          </Link>

        ) : null}

      </div>

    </div>

  );

};


