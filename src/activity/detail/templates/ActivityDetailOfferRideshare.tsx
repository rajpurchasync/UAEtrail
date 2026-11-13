import { useState } from 'react';
import { Car } from 'lucide-react';
import type { ActivityDetailDTO, ActivityViewerAccessDTO } from '@uaetrail/shared-types';
import { LinkRidesharePanel } from '../../../explore/ui/LinkRidesharePanel';
import { canLinkRideshareToActivity } from '../../../explore/linkActivityRideshareOffer';
import { HOSTING_LINK_RIDESHARE_CREATE } from '../../../explore/createFlowCopy';

export type ConsumerDetailOfferRideshareProps = {
  activity: ActivityDetailDTO;
  viewerAccess: ActivityViewerAccessDTO | null;
  /** Viewer's publishing tenant — never the parent outing's tenant for joiners. */
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
  if (!canLinkRideshareToActivity(activity)) return false;
  const entitlements = viewerAccess?.entitlements;
  const canAddLinkedRide = Boolean(entitlements?.canAddLinkedRide);
  const canOfferTransport = Boolean(entitlements?.canOfferTransport);
  if (!canAddLinkedRide && !canOfferTransport) return false;
  if (tenantId?.trim() && canAddLinkedRide) return true;
  return Boolean(onCreateRideshare) && canOfferTransport;
};

/** Joined crew / host — create or link a rideshare for this outing. */
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
  const publishingTenantId = tenantId?.trim() || null;
  const showHostLinkPanel = Boolean(publishingTenantId) && canAddLinkedRide;

  if (showHostLinkPanel && publishingTenantId) {
    return (
      <div className="min-w-0" aria-label="Offer a shared ride">
        {notice ? (
          <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200" role="status">
            {notice}
          </p>
        ) : null}
        <LinkRidesharePanel
          tenantId={publishingTenantId}
          parentActivityId={activity.id}
          onCreateRideshare={canOfferTransport ? onCreateRideshare : undefined}
          onLinked={onRideshareLinked}
          onError={(message) => setNotice(message)}
          embedded
        />
      </div>
    );
  }

  if (!onCreateRideshare || !canOfferTransport) {
    return null;
  }

  return (
    <div className="min-w-0" aria-label="Offer a shared ride">
      <button
        type="button"
        onClick={onCreateRideshare}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 py-3 text-sm font-bold text-sky-950 active:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100"
      >
        <Car className="h-4 w-4" aria-hidden />
        {HOSTING_LINK_RIDESHARE_CREATE}
      </button>
    </div>
  );
};
