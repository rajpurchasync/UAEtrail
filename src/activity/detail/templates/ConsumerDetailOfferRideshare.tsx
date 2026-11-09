import { useState } from 'react';
import { Car } from 'lucide-react';
import type { ActivityDetailDTO, ActivityViewerAccessDTO } from '@uaetrail/shared-types';
import { LinkRidesharePanel } from '../../../explore/ui/LinkRidesharePanel';
import { canLinkRideshareToActivity } from '../../../explore/linkActivityRideshareOffer';
import { HOSTING_LINK_RIDESHARE_CREATE } from '../../../explore/createFlowCopy';

export type ConsumerDetailOfferRideshareProps = {
  activity: ActivityDetailDTO;
  viewerAccess: ActivityViewerAccessDTO | null;
  tenantId: string | null;
  onCreateRideshare?: () => void;
  onRideshareLinked?: () => void;
};

export const consumerDetailOfferRideshareVisible = ({
  activity,
  viewerAccess,
  tenantId,
  onCreateRideshare,
}: Pick<
  ConsumerDetailOfferRideshareProps,
  'activity' | 'viewerAccess' | 'tenantId' | 'onCreateRideshare'
>): boolean => {
  const entitlements = viewerAccess?.entitlements;
  const canAddLinkedRide = Boolean(entitlements?.canAddLinkedRide);
  const canOfferTransport = Boolean(entitlements?.canOfferTransport);
  const showHostLinkPanel =
    canLinkRideshareToActivity(activity) && Boolean(tenantId?.trim()) && canAddLinkedRide;
  const showCreateOnly = Boolean(onCreateRideshare) && canOfferTransport && !showHostLinkPanel;
  return showHostLinkPanel || showCreateOnly;
};

/** Host / entitled members — create or paste-link a rideshare for this outing. */
export const ConsumerDetailOfferRideshare = ({
  activity,
  viewerAccess,
  tenantId,
  onCreateRideshare,
  onRideshareLinked,
}: ConsumerDetailOfferRideshareProps) => {
  const [notice, setNotice] = useState<string | null>(null);

  if (!consumerDetailOfferRideshareVisible({ activity, viewerAccess, tenantId, onCreateRideshare })) {
    return null;
  }

  const entitlements = viewerAccess?.entitlements;
  const canAddLinkedRide = Boolean(entitlements?.canAddLinkedRide);
  const canOfferTransport = Boolean(entitlements?.canOfferTransport);
  const showHostLinkPanel =
    canLinkRideshareToActivity(activity) && Boolean(tenantId?.trim()) && canAddLinkedRide;
  const showCreateOnly = Boolean(onCreateRideshare) && canOfferTransport && !showHostLinkPanel;

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

  if (!showCreateOnly || !onCreateRideshare) {
    return null;
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
