import type { ExploreCardModel } from '../../explore/exploreCardModel';
import { EXPLORE_BRAND_ACTIVE, EXPLORE_TYPE } from '../../config/exploreTheme';
import { useListFeedActions } from './ListFeedActionsProvider';

interface ListFeedPosterFooterProps {
  card: ExploreCardModel;
}

export const ListFeedPosterFooter = ({ card }: ListFeedPosterFooterProps) => {
  const { footerModel, onPrimaryFooter, onSecondaryFooter, joinStateLoading } = useListFeedActions();
  const model = footerModel(card);
  const primary = model.primary;
  const secondary = model.secondary;
  const primaryDisabled = primary.kind === 'disabled' || (joinStateLoading && primary.kind === 'action');

  return (
    <div className="flex gap-2 border-t border-neutral-100/70 bg-white px-3.5 pb-3.5 pt-2.5 sm:px-4 sm:pb-4 sm:pt-3">
      <button
        type="button"
        disabled={primaryDisabled}
        onClick={(event) => {
          event.stopPropagation();
          onPrimaryFooter(card);
        }}
        className={`min-h-11 flex-1 rounded-2xl px-3 text-sm font-bold shadow-sm active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 ${
          primary.kind === 'disabled'
            ? 'bg-amber-100 text-amber-900 shadow-none'
            : EXPLORE_BRAND_ACTIVE
        }`}
      >
        {primary.label}
      </button>
      {secondary ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSecondaryFooter(card);
          }}
          className={`flex min-h-11 flex-1 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-3 text-sm font-bold ${EXPLORE_TYPE.title} shadow-sm active:bg-neutral-50`}
        >
          {secondary.label}
        </button>
      ) : null}
    </div>
  );
};
