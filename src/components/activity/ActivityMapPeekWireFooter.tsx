import type { ActivityDTO } from '@uaetrail/shared-types';
import { resolveActivityMapPeekActionsForHostDto } from '../../activity/activityPeekEngagement';
import { executeActivityMapPeekAction, type ActivityMapPeekActionHandlers } from '../../activity/executeActivityMapPeekAction';
import { resolveListFeedFooterFromMapPeekWire } from '../../list/listFeedFooterActions';
import {
  DiscoveryCardMapPeekEngagementFooter,
  type DiscoveryCardMapPeekEngagementFooterProps,
} from '../../discovery/DiscoveryCardMapPeekEngagementFooter';

export type ActivityMapPeekWireFooterProps = {
  activity: ActivityDTO;
  handlers: ActivityMapPeekActionHandlers;
  variant?: DiscoveryCardMapPeekEngagementFooterProps['variant'];
  className?: string;
};

/** Publishing / hosting rows — same map-peek wire + list footer model + single action executor. */
export const ActivityMapPeekWireFooter = ({
  activity,
  handlers,
  variant = 'compact',
  className,
}: ActivityMapPeekWireFooterProps) => {
  const wire = resolveActivityMapPeekActionsForHostDto(activity);
  const model = resolveListFeedFooterFromMapPeekWire(wire);

  return (
    <DiscoveryCardMapPeekEngagementFooter
      model={model}
      variant={variant}
      className={className}
      onAction={(actionId) => executeActivityMapPeekAction(actionId, handlers)}
    />
  );
};