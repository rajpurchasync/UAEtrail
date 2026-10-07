import type { ExploreCardModel } from '../../explore/exploreCardModel';
import { DirectionsControl } from '../../components/ui/DirectionsControl';
import { EXPLORE_BRAND_ACTIVE } from '../../config/exploreTheme';
import { shouldShowListFeedImageCta } from '../listFeedFooterActions';
import { useListFeedActions } from './ListFeedActionsProvider';

interface ListFeedPosterImageCtaProps {
  card: ExploreCardModel;
  /** `stacked` — full-width row below hero; `overlay` — absolute on image bottom. */
  placement?: 'stacked' | 'overlay';
}

/** Primary join / gate CTA on category feed posters. */
export const ListFeedPosterImageCta = ({
  card,
  placement = 'overlay',
}: ListFeedPosterImageCtaProps) => {
  const { footerModel, onPrimaryFooter, joinStateLoading } = useListFeedActions();
  const model = footerModel(card);
  if (!shouldShowListFeedImageCta(model)) return null;

  const primary = model.primary;
  const primaryDisabled = primary.kind === 'disabled' || (joinStateLoading && primary.kind === 'action');

  if (primary.kind === 'directions') {
    const shellClass =
      placement === 'stacked'
        ? 'pointer-events-auto relative z-[4]'
        : 'pointer-events-auto absolute inset-x-0 bottom-0 z-[4]';
    return (
      <div className={shellClass} onClick={(event) => event.stopPropagation()}>
        <DirectionsControl
          lat={primary.lat}
          lng={primary.lng}
          variant="button"
          label={primary.label}
          className="w-full"
          buttonClassName={`flex min-h-11 w-full items-center justify-center px-4 py-3 text-sm font-bold active:opacity-95 ${EXPLORE_BRAND_ACTIVE}`}
          showAppPickerAffordance
        />
      </div>
    );
  }

  const shellClass =
    placement === 'stacked'
      ? 'pointer-events-auto relative z-[4]'
      : 'pointer-events-auto absolute inset-x-0 bottom-0 z-[4]';

  return (
    <div className={shellClass}>
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
