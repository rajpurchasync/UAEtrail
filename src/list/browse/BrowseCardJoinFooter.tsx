import { Link } from 'react-router-dom';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { useListFeedActionsOptional } from '../ui/ListFeedActionsProvider';
import { ListFeedWireFooterButtons } from '../ui/ListFeedWireFooterButtons';
import { BROWSE_CARD_FOOTER, BROWSE_CARD_PRIMARY_CTA } from './browseCardChrome';

type BrowseCardJoinFooterProps = {
  card: DiscoveryCardModel;
};

/** Trips browse card — join/RSVP when feed actions mount, else open the plan. */
export const BrowseCardJoinFooter = ({ card }: BrowseCardJoinFooterProps) => {
  const actions = useListFeedActionsOptional();
  if (actions) {
    return (
      <ListFeedWireFooterButtons
        card={card}
        model={actions.footerModel(card)}
        joinStateLoading={actions.joinStateLoadingForCard(card)}
        variant="listing"
        onPrimaryFooter={actions.onPrimaryFooter}
        onSecondaryFooter={actions.onSecondaryFooter}
      />
    );
  }

  return (
    <div className={BROWSE_CARD_FOOTER}>
      <Link to={card.path} className={BROWSE_CARD_PRIMARY_CTA}>
        {card.primaryCta}
      </Link>
    </div>
  );
};