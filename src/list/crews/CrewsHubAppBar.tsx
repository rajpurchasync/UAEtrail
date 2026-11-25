import { UserSearch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PRODUCT_MY_CREW_SURFACE_TITLE } from '@/content/productNorthStar';
import { CREW_FIND_SURFACE_LABEL } from '@/crew-discovery/ui/crewHubNavCopy';
import { findCrewDiscoveryListPath } from '@/discovery/discoverySession';
import { LIST_APP_BAR, LIST_CHROME, LIST_SEARCH } from '../browse/listChromeTheme';

/** My crew hub page — separate route from Find crew; matches list identity chrome. */
export const CrewsHubAppBar = () => (
  <header
    data-consumer-chrome-header
    className={`shrink-0 ${LIST_CHROME.chromeBg} ${LIST_CHROME.chromeBorder}`}
  >
    <div className={`mx-auto w-full max-w-6xl ${LIST_CHROME.horizontalPad} ${LIST_CHROME.standaloneMobileInset} pb-2`}>
      <div className={LIST_APP_BAR.row}>
        <h1 className={`${LIST_APP_BAR.title} min-w-0 flex-1`}>{PRODUCT_MY_CREW_SURFACE_TITLE}</h1>
        <Link
          to={findCrewDiscoveryListPath()}
          className={`${LIST_SEARCH.sideAction} ${LIST_SEARCH.sideActionMap} !w-auto gap-1.5 px-3.5 text-sm font-semibold`}
        >
          <UserSearch className="h-[17px] w-[17px]" aria-hidden />
          {CREW_FIND_SURFACE_LABEL}
        </Link>
      </div>
    </div>
  </header>
);