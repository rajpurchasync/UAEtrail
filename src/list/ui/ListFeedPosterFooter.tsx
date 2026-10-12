import type { ExploreCardModel } from '../../explore/exploreCardModel';
import { useListFeedActions } from './ListFeedActionsProvider';
import { ListFeedWireFooterButtons } from './ListFeedWireFooterButtons';

interface ListFeedPosterFooterProps {
  card: ExploreCardModel;
}

export const ListFeedPosterFooter = ({ card }: ListFeedPosterFooterProps) => {
  const { footerModel, onPrimaryFooter, onSecondaryFooter, joinStateLoading } = useListFeedActions();

  return (
    <ListFeedWireFooterButtons
      card={card}
      model={footerModel(card)}
      joinStateLoading={joinStateLoading}
      variant="poster"
      onPrimaryFooter={onPrimaryFooter}
      onSecondaryFooter={onSecondaryFooter}
    />
  );
};
