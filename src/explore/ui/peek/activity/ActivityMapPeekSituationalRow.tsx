import { ChevronRight, Car } from 'lucide-react';
import type { ActivityMapPeekSituationalModule } from '../../../../activity/resolveActivityMapPeekSituationalModules';
import { EXPLORE_PEEK } from '../../../../config/exploreTheme';

export const ActivityMapPeekSituationalRow = ({
  modules,
  onOpenLinkedPin,
  onGuestGatedAction,
}: {
  modules: ActivityMapPeekSituationalModule[];
  onOpenLinkedPin?: (exploreItemId: string) => void;
  onGuestGatedAction?: () => void;
}) => {
  if (modules.length === 0) return null;

  return (
    <ul className="space-y-1.5" aria-label="Linked transport">
      {modules.map((module) => {
        const canOpen = Boolean(module.exploreItemId && onOpenLinkedPin);
        const onPress = () => {
          if (onGuestGatedAction) {
            onGuestGatedAction();
            return;
          }
          if (module.exploreItemId && onOpenLinkedPin) onOpenLinkedPin(module.exploreItemId);
        };

        return (
          <li key={module.id}>
            {canOpen || onGuestGatedAction ? (
              <button type="button" onClick={onPress} className={EXPLORE_PEEK.tripSituationalBtn}>
                <Car className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{module.label}</span>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
              </button>
            ) : (
              <p className={`${EXPLORE_PEEK.tripSituationalBtn} pointer-events-none`}>{module.label}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
};