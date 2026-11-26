import { Link } from 'react-router-dom';
import { MapPinPlus, Megaphone, Users } from 'lucide-react';
import { EXPLORE_PEEK_CTA } from '../../config/exploreTheme';
import { ActivityPeekFooterIcon } from '@/discovery/discoverySessionExploreActivityPeekFooterIcon';

type DestinationDetailMobileActionBarProps = {
  findCrewPath: string;
  hostPath: string;
  addPlacePath: string;
};

/** Sticky footer — area-level go-together actions (matches map peek icon tiles). */
export const DestinationDetailMobileActionBar = ({
  findCrewPath,
  hostPath,
  addPlacePath,
}: DestinationDetailMobileActionBarProps) => (
  <div className="grid grid-cols-3 gap-1.5">
    <Link to={findCrewPath} className={EXPLORE_PEEK_CTA.peekTile} aria-label="Find crew in this destination">
      <ActivityPeekFooterIcon icon={Users} />
      <span className="max-w-full px-0.5">Find crew</span>
    </Link>
    <Link to={hostPath} className={EXPLORE_PEEK_CTA.peekTile} aria-label="Host an outing here">
      <ActivityPeekFooterIcon icon={Megaphone} />
      <span className="max-w-full px-0.5">Host outing</span>
    </Link>
    <Link to={addPlacePath} className={EXPLORE_PEEK_CTA.peekTile} aria-label="Add a place to the map">
      <ActivityPeekFooterIcon icon={MapPinPlus} />
      <span className="max-w-full px-0.5">Add place</span>
    </Link>
  </div>
);
