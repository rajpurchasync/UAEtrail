import { Link } from 'react-router-dom';
import { Users, UsersRound } from 'lucide-react';
import {
  PRODUCT_FRIENDS_SURFACE_LABEL,
  PRODUCT_GROUPS_SURFACE_LABEL,
  PRODUCT_MY_CREW_CARD_SUBTITLE,
  PRODUCT_MY_CREW_CARD_TITLE,
} from '../../content/productNorthStar';
import {
  myCrewsPathFromCrews,
  crewsReturnBackState,
  groupsPathFromCrews,
} from '../../crew/crewSurfaceNav';

const rowClass =
  'flex w-full items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-left transition hover:bg-emerald-50';

export const CrewsMyCrewCard = () => {
  const back = crewsReturnBackState();

  return (
    <section aria-labelledby="crews-my-crew" className="mb-4">
      <h2 id="crews-my-crew" className="mb-1 text-base font-bold text-neutral-900">
        {PRODUCT_MY_CREW_CARD_TITLE}
      </h2>
      <p className="mb-3 text-xs text-neutral-600">{PRODUCT_MY_CREW_CARD_SUBTITLE}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Link to={myCrewsPathFromCrews()} state={back} className={rowClass}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 ring-1 ring-emerald-100">
            <Users className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-neutral-900">{PRODUCT_FRIENDS_SURFACE_LABEL}</span>
            <span className="block text-xs text-neutral-600">People you&apos;re connected with</span>
          </span>
        </Link>
        <Link to={groupsPathFromCrews()} state={back} className={rowClass}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 ring-1 ring-emerald-100">
            <UsersRound className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-neutral-900">{PRODUCT_GROUPS_SURFACE_LABEL}</span>
            <span className="block text-xs text-neutral-600">Family &amp; friends teams</span>
          </span>
        </Link>
      </div>
    </section>
  );
};