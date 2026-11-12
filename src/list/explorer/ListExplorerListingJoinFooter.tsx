import { Link } from 'react-router-dom';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { useListFeedActionsOptional } from '../ui/ListFeedActionsProvider';
import { ListFeedWireFooterButtons } from '../ui/ListFeedWireFooterButtons';
import {
  LIST_EXPLORER_LISTING_FOOTER,
  LIST_EXPLORER_LISTING_PRIMARY_CTA,
} from './listExplorerListingChrome';

type ListExplorerListingJoinFooterProps = {
  card: DiscoveryCardModel;
};

/** Trip listing CTA — join/RSVP when the feed provider is mounted, else open the plan. */
export const ListExplorerListingJoinFooter = ({ card }: ListExplorerListingJoinFooterProps) => {
  const actions = useListFeedActionsOptional();
  if (actions) {
    return (
      <ListFeedWireFooterButtons
        card={card}
        model={actions.footerModel(card)}
        joinStateLoading={actions.joinStateLoading}
        variant="listing"
        primaryOnly
        onPrimaryFooter={actions.onPrimaryFooter}
        onSecondaryFooter={actions.onSecondaryFooter}
      />
    );
  }

  return (
    <div className={LIST_EXPLORER_LISTING_FOOTER}>
      <Link to={card.path} className={LIST_EXPLORER_LISTING_PRIMARY_CTA}>
        {card.primaryCta}
      </Link>
    </div>
  );
};
