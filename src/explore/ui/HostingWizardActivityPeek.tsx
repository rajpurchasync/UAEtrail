import { useEffect, useState } from 'react';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { buildDiscoveryCardViewModelCard } from '../../discovery/discoveryCardViewModel';
import { fetchPublicActivityDetail } from '../../hooks/publicActivityClientApi';
import { buildExploreMapItemFromActivity } from '../privateActivityExploreItem';
import { ActivityMapPeekHost } from './ActivityMapPeekHost';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';

type HostingWizardActivityPeekProps = {
  activityId: string;
  onClose: () => void;
};

/** Activity peek over compose wizard — dismiss returns to the same wizard step. */
export const HostingWizardActivityPeek = ({ activityId, onClose }: HostingWizardActivityPeekProps) => {
  const [card, setCard] = useState<DiscoveryCardModel | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCard(null);
    setFailed(false);
    void fetchPublicActivityDetail(activityId)
      .then((detail) => {
        if (cancelled) return;
        const item = buildExploreMapItemFromActivity(detail.activity, detail.viewerAccess);
        setCard(buildDiscoveryCardViewModelCard(item));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  if (!card) {
    return (
      <ExploreResponsiveSheet
        open
        onClose={onClose}
        overlayFixed
        zClass={EXPLORE_Z.guestJoinSheet}
        maxWidthClass="max-w-md"
        showHandle={false}
        ariaLabel="Outing details"
      >
        <div className="px-4 py-8 text-center text-sm text-neutral-600">
          {failed ? 'Could not load this outing.' : 'Loading outing…'}
        </div>
      </ExploreResponsiveSheet>
    );
  }

  return (
    <ActivityMapPeekHost
      presentation="modal"
      modalZClass={EXPLORE_Z.guestJoinSheet}
      card={card}
      onClose={onClose}
      embedMode
      showDismissChrome
    />
  );
};
