import { Link } from 'react-router-dom';
import { ChevronRight, MapPin } from 'lucide-react';
import { DETAIL_SCROLL_PANEL } from '../../../components/mobile/detailScrollSectionStyles';
import { activityPlaceReturnState } from '@/discovery/discoveryPortExploreRouting';

type ActivityDetailLinkedPlaceLinkProps = {
  name: string;
  to: string | null;
  /** Activity detail, or the hosting manage URL that reopens this outing. */
  returnTo: string;
  eyebrow?: string;
};

/** Tagged place on an outing. Back from the place screen returns to `returnTo`. */
export const ActivityDetailLinkedPlaceLink = ({
  name,
  to,
  returnTo,
  eyebrow = 'Place',
}: ActivityDetailLinkedPlaceLinkProps) => {
  const state = activityPlaceReturnState(returnTo);

  const body = (
    <>
      <MapPin className="h-5 w-5 shrink-0 text-emerald-800" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">{eyebrow}</p>
        <p className="truncate text-sm font-semibold text-neutral-950">{name}</p>
      </div>
      {to ? <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden /> : null}
    </>
  );

  const className = `${DETAIL_SCROLL_PANEL.place} text-left`;

  if (!to) {
    return <div className={className}>{body}</div>;
  }

  return (
    <Link
      to={to}
      state={state}
      data-nav-focus="activity-linked-place"
      className={`${className} transition hover:bg-emerald-50/40`}
    >
      {body}
    </Link>
  );
};
