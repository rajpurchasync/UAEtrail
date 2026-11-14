import type { MouseEvent, ReactNode } from 'react';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { DirectionsControl } from '../../components/ui/DirectionsControl';
import { EXPLORE_BRAND_ACTIVE, EXPLORE_TYPE } from '../../config/exploreTheme';
import type { ListFeedFooterButton, ListFeedFooterModel } from '../listFeedFooterActions';
import { BROWSE_CARD_FOOTER, BROWSE_CARD_PRIMARY_CTA } from '../browse/browseCardChrome';

export type ListFeedWireFooterVariant = 'poster' | 'compact' | 'listing';

const variantStyles: Record<
  ListFeedWireFooterVariant,
  {
    shell: string;
    primaryHeight: string;
    primaryRadius: string;
    primaryText: string;
    primaryPad: string;
    secondaryHeight: string;
    secondaryRadius: string;
    secondaryText: string;
    secondaryPad: string;
  }
> = {
  poster: {
    shell: 'flex gap-2 border-t border-neutral-100/70 bg-white px-3.5 pb-3.5 pt-2.5 sm:px-4 sm:pb-4 sm:pt-3',
    primaryHeight: 'min-h-11',
    primaryRadius: 'rounded-2xl',
    primaryText: 'text-sm',
    primaryPad: 'px-3',
    secondaryHeight: 'min-h-11',
    secondaryRadius: 'rounded-2xl',
    secondaryText: 'text-sm',
    secondaryPad: 'px-3',
  },
  compact: {
    shell: 'flex gap-2 border-t border-neutral-100/80 px-3 pb-3 pt-2 pl-[4.25rem]',
    primaryHeight: 'min-h-9',
    primaryRadius: 'rounded-xl',
    primaryText: 'text-xs',
    primaryPad: 'px-2.5',
    secondaryHeight: 'min-h-9',
    secondaryRadius: 'rounded-xl',
    secondaryText: 'text-xs',
    secondaryPad: 'px-2.5',
  },
  listing: {
    shell: BROWSE_CARD_FOOTER,
    primaryHeight: 'h-9',
    primaryRadius: 'rounded-[8px]',
    primaryText: 'text-[12px]',
    primaryPad: 'px-2',
    secondaryHeight: 'h-9',
    secondaryRadius: 'rounded-[8px]',
    secondaryText: 'text-[12px]',
    secondaryPad: 'px-2',
  },
};

type ListFeedWireFooterButtonsProps = {
  card: DiscoveryCardModel;
  model: ListFeedFooterModel;
  joinStateLoading: boolean;
  variant: ListFeedWireFooterVariant;
  /** Catalogue trip cards — join only; detail is the card tap. */
  primaryOnly?: boolean;
  onPrimaryFooter: (card: DiscoveryCardModel) => void;
  onSecondaryFooter: (card: DiscoveryCardModel) => void;
};

const stopPropagation = (event: MouseEvent) => event.stopPropagation();

export const ListFeedWireFooterButtons = ({
  card,
  model,
  joinStateLoading,
  variant,
  primaryOnly = false,
  onPrimaryFooter,
  onSecondaryFooter,
}: ListFeedWireFooterButtonsProps) => {
  const styles = variantStyles[variant];
  const primary = model.primary;
  const secondary = primaryOnly ? null : model.secondary;
  const primaryDisabled =
    primary.kind === 'disabled' || (joinStateLoading && primary.kind === 'action');

  const primaryActionClass =
    variant === 'listing'
      ? `${BROWSE_CARD_PRIMARY_CTA} ${
          primary.kind === 'disabled' ? 'bg-amber-100 text-amber-900 shadow-none hover:bg-amber-100' : ''
        }`
      : `${styles.primaryHeight} flex-1 ${styles.primaryRadius} ${styles.primaryPad} ${styles.primaryText} font-bold shadow-sm active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 ${
          primary.kind === 'disabled'
            ? 'bg-amber-100 text-amber-900 shadow-none'
            : EXPLORE_BRAND_ACTIVE
        }`;

  const secondaryActionClass = `flex ${styles.secondaryHeight} flex-1 items-center justify-center ${styles.secondaryRadius} border border-neutral-200 bg-white ${styles.secondaryPad} ${styles.secondaryText} font-bold ${EXPLORE_TYPE.title} shadow-sm active:bg-neutral-50`;

  const renderFooterButton = (
    button: ListFeedFooterButton,
    role: 'primary' | 'secondary'
  ): ReactNode => {
    if (button.kind === 'directions') {
      const brandClass =
        role === 'primary'
          ? `flex ${styles.primaryHeight} w-full flex-1 items-center justify-center ${styles.primaryRadius} ${styles.primaryPad} ${styles.primaryText} font-bold shadow-sm ${EXPLORE_BRAND_ACTIVE}`
          : secondaryActionClass;
      return (
        <DirectionsControl
          lat={button.lat}
          lng={button.lng}
          variant="button"
          label={button.label}
          className="min-w-0 flex-1"
          buttonClassName={brandClass}
          showAppPickerAffordance={false}
        />
      );
    }

    const onClick = (event: MouseEvent) => {
      stopPropagation(event);
      if (role === 'primary') onPrimaryFooter(card);
      else onSecondaryFooter(card);
    };

    if (role === 'primary') {
      return (
        <button type="button" disabled={primaryDisabled} onClick={onClick} className={primaryActionClass}>
          {button.label}
        </button>
      );
    }

    return (
      <button type="button" onClick={onClick} className={secondaryActionClass}>
        {button.label}
      </button>
    );
  };

  return (
    <div className={styles.shell} onClick={stopPropagation}>
      {renderFooterButton(primary, 'primary')}
      {secondary ? renderFooterButton(secondary, 'secondary') : null}
    </div>
  );
};
