import type { MouseEvent, ReactNode } from 'react';
import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import { EXPLORE_BRAND_ACTIVE, EXPLORE_TYPE } from '../../config/exploreTheme';
import type { ListFeedFooterButton, ListFeedFooterModel } from '../listFeedFooterActions';

export type ListFeedMapPeekFooterVariant = 'compact' | 'console';

type ListFeedMapPeekFooterButtonsProps = {
  model: ListFeedFooterModel;
  variant?: ListFeedMapPeekFooterVariant;
  onAction: (actionId: ActivityMapPeekActionId) => void;
  className?: string;
};

const variantStyles: Record<
  ListFeedMapPeekFooterVariant,
  { shell: string; primary: string; secondary: string }
> = {
  compact: {
    shell: 'flex gap-2 pt-1',
    primary: `min-h-9 flex-1 rounded-xl px-2.5 text-xs font-bold shadow-sm active:scale-[0.99] ${EXPLORE_BRAND_ACTIVE}`,
    secondary: `flex min-h-9 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white px-2.5 text-xs font-bold ${EXPLORE_TYPE.title} shadow-sm active:bg-neutral-50`,
  },
  console: {
    shell: 'flex flex-wrap items-center gap-1.5',
    primary:
      'inline-flex min-h-9 items-center justify-center rounded-lg border border-emerald-600 bg-emerald-600 px-2.5 text-xs font-semibold text-white hover:bg-emerald-700',
    secondary:
      'inline-flex min-h-9 items-center justify-center rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-800 hover:border-emerald-300 hover:text-emerald-800',
  },
};

const stopPropagation = (event: MouseEvent) => event.stopPropagation();

const runButton = (
  button: ListFeedFooterButton,
  onAction: (actionId: ActivityMapPeekActionId) => void
): void => {
  if (button.kind === 'action') onAction(button.actionId);
};

export const ListFeedMapPeekFooterButtons = ({
  model,
  variant = 'compact',
  onAction,
  className = '',
}: ListFeedMapPeekFooterButtonsProps) => {
  const styles = variantStyles[variant];

  const renderButton = (button: ListFeedFooterButton, tone: 'primary' | 'secondary'): ReactNode => {
    if (button.kind !== 'action' && button.kind !== 'disabled') return null;
    const onClick = (event: MouseEvent) => {
      stopPropagation(event);
      if (button.kind === 'action') runButton(button, onAction);
    };
    const classNames = tone === 'primary' ? styles.primary : styles.secondary;
    return (
      <button
        type="button"
        disabled={button.kind === 'disabled'}
        onClick={onClick}
        className={classNames}
      >
        {button.label}
      </button>
    );
  };

  return (
    <div
      className={`${styles.shell} ${className}`}
      data-list-feed-map-peek-footer
      onClick={stopPropagation}
    >
      {renderButton(model.primary, 'primary')}
      {model.secondary ? renderButton(model.secondary, 'secondary') : null}
    </div>
  );
};