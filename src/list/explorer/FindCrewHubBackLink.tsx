import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PRODUCT_MY_CREW_SURFACE_TITLE } from '@/content/productNorthStar';
import { crewsHubHomePath } from '@/discovery/discoverySession';
import { LIST_SEARCH } from '@/list/browse/listChromeTheme';

/** Mirror of My crew hub “Find crew” CTA — returns to My crew. */
export const FindCrewHubBackLink = () => (
  <Link
    to={crewsHubHomePath()}
    className={`${LIST_SEARCH.sideAction} h-10 shrink-0 !w-auto gap-1.5 rounded-2xl px-4 text-sm font-bold shadow-sm text-emerald-800`}
  >
    <ChevronLeft className="h-[18px] w-[18px]" aria-hidden />
    {PRODUCT_MY_CREW_SURFACE_TITLE}
  </Link>
);