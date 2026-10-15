import { createPortal } from 'react-dom';
import { EXPLORE_PEEK, EXPLORE_Z } from '../../config/exploreTheme';
import { MapPeekOverlay } from './map-peek';
import { ActivityPeekCard, type ActivityPeekCardProps } from './peek/ActivityPeekCard';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';

export type ActivityMapPeekHostProps = ActivityPeekCardProps & {
  /** Map stage anchor vs portaled sheet (member hub sheets, etc.). */
  presentation?: 'map' | 'modal';
};

/**
 * **Mount** for {@link ActivityPeekCard} on the map (or modal) — not “activity host” (organizer).
 * Hosted outings and looking-for (**seeking**) pins share this path + `peek/activity/*`;
 * wire `mapPeekActions` drives organizer tools when the row is activity-backed (S12).
 */
export const ActivityMapPeekHost = ({
  presentation = 'map',
  ...props
}: ActivityMapPeekHostProps) => {
  if (presentation === 'modal') {
    return createPortal(
      <ExploreResponsiveSheet
        open
        onClose={props.onClose}
        overlayFixed
        zClass={EXPLORE_Z.composeFlow}
        maxWidthClass="max-w-md"
        panelClassName="!rounded-2xl !p-0 !shadow-none !ring-0 overflow-hidden bg-transparent"
        showHandle={false}
        ariaLabel="Hosted activity"
      >
        <div className={`${EXPLORE_PEEK.shell} w-full`}>
          <ActivityPeekCard {...props} />
        </div>
      </ExploreResponsiveSheet>,
      document.body
    );
  }

  return (
    <MapPeekOverlay onClose={props.onClose}>
      <ActivityPeekCard {...props} />
    </MapPeekOverlay>
  );
};
