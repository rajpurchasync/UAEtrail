import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import type { ListFeedFooterModel } from '../list/browse/listFeedFooterActions';
import {
  ListFeedMapPeekFooterButtons,
  type ListFeedMapPeekFooterVariant,
} from '../list/browse/ListFeedMapPeekFooterButtons';

export type DiscoveryCardMapPeekEngagementFooterProps = {
  model: ListFeedFooterModel;
  variant?: ListFeedMapPeekFooterVariant;
  onAction: (actionId: ActivityMapPeekActionId) => void;
  className?: string;
};

/** Map/list wire peek — renders `ListFeedFooterModel` from `resolveListFeedFooterModel` (§6.1.2). */
export const DiscoveryCardMapPeekEngagementFooter = ({
  model,
  variant = 'compact',
  onAction,
  className,
}: DiscoveryCardMapPeekEngagementFooterProps) => (
  <ListFeedMapPeekFooterButtons
    model={model}
    variant={variant}
    onAction={onAction}
    className={className}
  />
);