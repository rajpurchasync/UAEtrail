import { Link } from 'react-router-dom';
import type { ExplorePeekDetailAccess } from '../../../../access/resolvePeekDetailAccess';
import type { MapPeekDetailNavState } from '../../../mapPeekDetailNavState';

/** Outing name — largest text band on the trip peek. */
export const ActivityMapPeekTitle = ({
  title,
  detailAccess,
  onGuestGatedDetail,
  onBeforeDetailNavigate,
  detailLinkState,
}: {
  title: string;
  detailAccess?: ExplorePeekDetailAccess | null;
  onGuestGatedDetail?: () => void;
  onBeforeDetailNavigate?: () => void;
  detailLinkState?: MapPeekDetailNavState;
}) => {
  if (!title.trim()) return null;

  if (detailAccess?.kind === 'link') {
    return (
      <Link
        to={detailAccess.href}
        state={detailLinkState}
        className="text-left hover:underline decoration-neutral-400/60 underline-offset-2"
        onClick={() => onBeforeDetailNavigate?.()}
      >
        {title}
      </Link>
    );
  }

  if (detailAccess?.kind === 'guest_gate' && onGuestGatedDetail) {
    return (
      <button type="button" onClick={onGuestGatedDetail} className="text-left">
        {title}
      </button>
    );
  }

  return <span>{title}</span>;
};