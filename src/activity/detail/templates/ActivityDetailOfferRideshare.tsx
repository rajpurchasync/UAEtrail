import { useState } from 'react';
import { Car } from 'lucide-react';
import type { ActivityDetailDTO, ActivityViewerAccessDTO } from '@uaetrail/shared-types';
import { LinkRidesharePanel } from '../../../explore/ui/LinkRidesharePanel';
import { canLinkRideshareToActivity } from '../../../explore/linkActivityRideshareOffer';
import { HOSTING_LINK_RIDESHARE_CREATE } from '../../../explore/createFlowCopy';

export type ActivityDetailOfferRideshareProps = {
  activity: ActivityDetailDTO;
  viewerAccess: ActivityViewerAccessDTO | null;
  tenantId: string | null;
  onCreateRideshare?: () => void;
  onRideshareLinked?: () => void;
};

/** Host / entitled members — create or paste-link a rideshare for this outing. */
export const ActivityDetailOfferRideshare = ({
  activity,
  viewerAccess,
  tenantId,
  onCreateRideshare,
  onRideshareLinked,
}: ActivityDetailOfferRideshareProps) => {
  const [notice, setNotice] = useState<string | null>(null);
  const entitlements = viewerAccess?.entitlements;
  const canAddLinkedRide = Boolean(entitlements?.canAddLinkedRide);
  const canOfferTransport = Boolean(entitlements?.canOfferTransport);
  const showHostLinkPanel =
    canLinkRideshareToActivity(activity) && Boolean(tenantId?.trim()) && canAddLinkedRide;
  const showCreateOnly = Boolean(onCreateRideshare) && canOfferTransport && !showHostLinkPanel;

  if (!showHostLinkPanel && !showCreateOnly) return null;

  if (showHostLinkPanel && tenantId) {
    return (
      <section className="mt-3" aria-label="Offer a shared ride">
        {notice ? (
          <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="status">
            {notice}
          </p>
        ) : null}
        <LinkRidesharePanel
          tenantId={tenantId}
          parentActivityId={activity.id}
          onCreateRideshare={() => onCreateRideshare?.()}
          onLinked={onRideshareLinked}
          onError={(message) => setNotice(message)}
        />
      </section>
    );
  }

  return (
    <section className="mt-3" aria-label="Offer a shared ride">
      <button
        type="button"
        onClick={onCreateRideshare}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50/90 py-3 text-sm font-bold text-sky-900 active:bg-sky-100/90"
      >
        <Car className="h-4 w-4" aria-hidden />
        {HOSTING_LINK_RIDESHARE_CREATE}
      </button>
    </section>
  );
};
