import { Link } from 'react-router-dom';
import type { DiscoveryCardModel } from './discoveryCardModel';
import { useListFeedActionsOptional } from '../list/ui/ListFeedActionsProvider';
import { BROWSE_CARD_FOOTER, BROWSE_CARD_PRIMARY_CTA } from '../list/browse/browseCardChrome';
import { DiscoveryCardWireEngagementFooter } from './DiscoveryCardWireEngagementFooter';

type DiscoveryBrowseListEngagementFooterProps = {
  card: DiscoveryCardModel;
};

/** Trips browse card — join/RSVP when feed actions mount, else open the plan (§6.1.2 engagement slot). */
export const DiscoveryBrowseListEngagementFooter = ({
  card,
}: DiscoveryBrowseListEngagementFooterProps) => {
  const actions = useListFeedActionsOptional();
  if (actions) {
    return <DiscoveryCardWireEngagementFooter card={card} variant="listing" />;
  }

  return (
    <div className={BROWSE_CARD_FOOTER}>
      <Link to={card.path} className={BROWSE_CARD_PRIMARY_CTA}>
        {card.primaryCta}
      </Link>
    </div>
  );
};