import { Link, useLocation } from 'react-router-dom';
import { browseListBucketTabClass } from '@/list/browse/listChromeTheme';
import { CREW_FIND_SURFACE_LABEL } from '@/crew-discovery/ui/crewHubNavCopy';
import { PRODUCT_MY_CREW_SURFACE_TITLE } from '@/content/productNorthStar';
import { crewsHubHomePath, findCrewDiscoveryListPath } from '@/list/browse/browseListRouting';
import { parseCrewPeopleSurface } from '@/crew-discovery/crewPeopleSurface';

/** My crew ↔ Find crew — same segmented control pattern as Trips / Places bucket toggle. */
export const MyCrewSurfaceSwitch = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const surface = parseCrewPeopleSurface(params);
  const myActive = surface !== 'find';

  const tabClass = (active: boolean) =>
    `${browseListBucketTabClass(active)} inline-flex h-9 min-w-0 flex-1 items-center justify-center rounded-full px-3 text-[13px] font-semibold transition`;

  return (
    <div
      className="flex w-full min-w-0 rounded-full border border-neutral-200/80 bg-neutral-100/90 p-0.5"
      role="tablist"
      aria-label="Crews"
    >
      <Link
        to={crewsHubHomePath()}
        role="tab"
        aria-selected={myActive}
        className={tabClass(myActive)}
      >
        {PRODUCT_MY_CREW_SURFACE_TITLE}
      </Link>
      <Link
        to={findCrewDiscoveryListPath()}
        role="tab"
        aria-selected={!myActive}
        className={tabClass(!myActive)}
      >
        {CREW_FIND_SURFACE_LABEL}
      </Link>
    </div>
  );
};