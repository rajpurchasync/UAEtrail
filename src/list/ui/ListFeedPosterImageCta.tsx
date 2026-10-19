import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { DirectionsControl } from '../../components/ui/DirectionsControl';
import { EXPLORE_BRAND_ACTIVE, EXPLORE_TYPE } from '../../config/exploreTheme';
import { shouldShowListFeedImageCta } from '../listFeedFooterActions';
import { useListFeedActions } from './ListFeedActionsProvider';

interface ListFeedPosterImageCtaProps {
  card: DiscoveryCardModel;
  /** `stacked` — full-width row below hero; `overlay` — absolute on image bottom. */
  placement?: 'stacked' | 'overlay';
}

/** Primary + secondary CTAs on category feed posters (aligned with map peek). */
export const ListFeedPosterImageCta = ({
  card,
  placement = 'overlay',
}: ListFeedPosterImageCtaProps) => {
  const { footerModel, onPrimaryFooter, onSecondaryFooter, joinStateLoading } = useListFeedActions();
  const model = footerModel(card);
  if (!shouldShowListFeedImageCta(model)) return null;

  const primary = model.primary;
  const secondary = model.secondary;
  const primaryDisabled =
    primary.kind === 'disabled' || (joinStateLoading && primary.kind === 'action');

  const shellClass =
    placement === 'stacked'
      ? 'pointer-events-auto relative z-[4]'
      : 'pointer-events-auto absolute inset-x-0 bottom-0 z-[4]';

  const rowClass = 'flex w-full items-stretch border-t border-neutral-100/80 bg-white';
  const secondaryClass = `flex min-h-11 flex-1 items-center justify-center rounded-none border-l border-neutral-200/80 bg-white px-3 text-sm font-bold ${EXPLORE_TYPE.title} active:bg-neutral-50`;

  const primaryClass = `flex min-h-11 flex-1 items-center justify-center px-4 py-3 text-sm font-bold active:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 ${
    primary.kind === 'disabled' ? 'bg-amber-600 text-amber-50' : EXPLORE_BRAND_ACTIVE
  }`;

  return (
    <div className={shellClass} onClick={(event) => event.stopPropagation()}>
      <div className={rowClass}>
        {primary.kind === 'directions' ? (
          <DirectionsControl
            lat={primary.lat}
            lng={primary.lng}
            variant="button"
            label={primary.label}
            className="min-w-0 flex-1"
            buttonClassName={`flex min-h-11 w-full flex-1 items-center justify-center gap-2 rounded-none px-4 py-3 text-sm font-bold active:opacity-95 ${EXPLORE_BRAND_ACTIVE}`}
            showAppPickerAffordance={false}
          />
        ) : (
          <button
            type="button"
            disabled={primaryDisabled}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onPrimaryFooter(card);
            }}
            className={primaryClass}
          >
            {primary.label}
          </button>
        )}
        {secondary ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onSecondaryFooter(card);
            }}
            className={secondaryClass}
          >
            {secondary.label}
          </button>
        ) : null}
      </div>
    </div>
  );
};
