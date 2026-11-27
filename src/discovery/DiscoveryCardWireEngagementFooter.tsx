import type { DiscoveryCardModel } from './discoveryCardModel';
import { useListFeedActionsOptional } from '../list/browse/ListFeedActionsProvider';
import {
  ListFeedWireFooterButtons,
  type ListFeedWireFooterVariant,
} from './discoveryPortListPeek';

export type DiscoveryCardWireEngagementFooterProps = {
  card: DiscoveryCardModel;
  variant: ListFeedWireFooterVariant;
  /** Catalogue trip cards — join only; detail is the card tap. */
  primaryOnly?: boolean;
};

/** List / row wire footer — `resolveListFeedFooterModel` when `ListFeedActionsProvider` is mounted (§6.1.2). */
export const DiscoveryCardWireEngagementFooter = ({
  card,
  variant,
  primaryOnly,
}: DiscoveryCardWireEngagementFooterProps) => {
  const actions = useListFeedActionsOptional();
  if (!actions) return null;

  return (
    <ListFeedWireFooterButtons
      card={card}
      model={actions.footerModel(card)}
      joinStateLoading={actions.joinStateLoadingForCard(card)}
      variant={variant}
      primaryOnly={primaryOnly}
      onPrimaryFooter={actions.onPrimaryFooter}
      onSecondaryFooter={actions.onSecondaryFooter}
    />
  );
};