import type { ExploreCardModel } from '../../explore/exploreCardModel';
import { EXPLORE_BRAND_ACTIVE } from '../../config/exploreTheme';
import { shouldShowListFeedImageCta } from '../listFeedFooterActions';
import { useListFeedActions } from './ListFeedActionsProvider';

interface ListFeedPosterImageCtaProps {
  card: ExploreCardModel;
}

/** Primary join / gate CTA — flush to bottom of poster image (no separate footer row). */
export const ListFeedPosterImageCta = ({ card }: ListFeedPosterImageCtaProps) => {
  const { footerModel, onPrimaryFooter, joinStateLoading } = useListFeedActions();
  const model = footerModel(card);
  if (!shouldShowListFeedImageCta(model)) return null;

  const primary = model.primary;
  const primaryDisabled = primary.kind === 'disabled' || (joinStateLoading && primary.kind === 'action');

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-[4]">
      <button
        type="button"
        disabled={primaryDisabled}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onPrimaryFooter(card);
        }}
        className={`flex min-h-11 w-full items-center justify-center px-4 py-3 text-sm font-bold active:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 ${
          primary.kind === 'disabled' ? 'bg-amber-600 text-amber-50' : EXPLORE_BRAND_ACTIVE
        }`}
      >
        {primary.label}
      </button>
    </div>
  );
};
