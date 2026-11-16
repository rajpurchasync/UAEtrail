import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import { PeekDetailLink } from '../../map-peek/PeekDetailLink';

export type AvailabilityPeekActionsProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  onMessage?: () => void;
  onGuestGatedAction?: (action: ActivityMapPeekActionId) => void;
};

const primaryButtonClass =
  'flex-1 rounded-xl py-2.5 text-center text-sm font-bold text-white transition-colors bg-emerald-600 hover:bg-emerald-700';

const secondaryButtonClass =
  'flex-1 rounded-xl border border-neutral-200/80 bg-white/70 py-2.5 text-center text-sm font-semibold text-gray-800 transition-colors hover:bg-white';

/** Fixed crew availability on the map — profile + message (no activity join). */
export const AvailabilityPeekActions = ({
  card,
  onClose,
  onMessage,
  onGuestGatedAction,
}: AvailabilityPeekActionsProps) => {
  const gate = onGuestGatedAction;

  return (
    <div className="flex gap-2">
      <PeekDetailLink
        card={card}
        label={card.primaryCta ?? 'View profile'}
        className={primaryButtonClass}
        onGuestGatedAction={gate ? () => gate('view_detail') : undefined}
        onBeforeNavigate={onClose}
      />
      {onMessage ? (
        <button type="button" onClick={onMessage} className={secondaryButtonClass}>
          {card.secondaryCta ?? 'Message'}
        </button>
      ) : (
        <PeekDetailLink
          card={card}
          label={card.secondaryCta ?? 'Message'}
          className={secondaryButtonClass}
          onGuestGatedAction={gate ? () => gate('view_detail') : undefined}
          onBeforeNavigate={onClose}
        />
      )}
    </div>
  );
};