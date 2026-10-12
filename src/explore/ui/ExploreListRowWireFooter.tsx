import type { ExploreCardModel } from '../exploreCardModel';
import { useListFeedActionsOptional } from '../../list/ui/ListFeedActionsProvider';
import { ListFeedWireFooterButtons } from '../../list/ui/ListFeedWireFooterButtons';

interface ExploreListRowWireFooterProps {
  card: ExploreCardModel;
}

/** L1 peek footer parity on map-aligned compact list rows (`list=1`). */
export const ExploreListRowWireFooter = ({ card }: ExploreListRowWireFooterProps) => {
  const actions = useListFeedActionsOptional();
  if (!actions) return null;

  const { footerModel, onPrimaryFooter, onSecondaryFooter, joinStateLoading } = actions;

  return (
    <ListFeedWireFooterButtons
      card={card}
      model={footerModel(card)}
      joinStateLoading={joinStateLoading}
      variant="compact"
      onPrimaryFooter={onPrimaryFooter}
      onSecondaryFooter={onSecondaryFooter}
    />
  );
};
