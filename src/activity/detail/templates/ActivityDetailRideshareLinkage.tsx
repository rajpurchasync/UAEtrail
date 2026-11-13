import { useState } from 'react';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { ActivityLinkedParentPlanAffordance } from '../../../components/activity/ActivityLinkedParentPlanAffordance';
import {
  ACTIVITY_DETAIL_RIDESHARE_UNLINKED_GUEST,
  HOSTING_RIDESHARE_LINKED_NOTICE,
  HOSTING_RIDESHARE_UNLINK_LABEL,
  HOSTING_RIDESHARE_UNLINKED_NOTICE,
} from '../../../explore/createFlowCopy';
import { unlinkRideshareFromParentActivity } from '../../../explore/linkActivityRideshareOffer';
import { LinkParentActivityPanel } from '../../../explore/ui/LinkParentActivityPanel';
import { resolveActivityLinkedParentSummary } from '../../../activity/resolveActivityLinkageSummaries';

export type ConsumerDetailRideshareLinkageProps = {
  activity: ActivityDetailDTO;
  isRideHost: boolean;
  hostTenantId: string | null;
  onParentLinked?: () => void;
};

/** Rideshare consumer detail — parent plan link, host link flow, or host unlink. */
export const ConsumerDetailRideshareLinkage = ({
  activity,
  isRideHost,
  hostTenantId,
  onParentLinked,
}: ConsumerDetailRideshareLinkageProps) => {
  const [notice, setNotice] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState(false);
  const linkedParent = resolveActivityLinkedParentSummary(activity);
  const publishingTenantId = hostTenantId?.trim() || null;

  const handleUnlink = async () => {
    if (!publishingTenantId) return;
    setUnlinking(true);
    setNotice(null);
    try {
      await unlinkRideshareFromParentActivity(publishingTenantId, activity.id);
      setNotice(HOSTING_RIDESHARE_UNLINKED_NOTICE);
      onParentLinked?.();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not unlink ride.');
    } finally {
      setUnlinking(false);
    }
  };

  const showLinkedParent =
    Boolean(linkedParent) && notice !== HOSTING_RIDESHARE_UNLINKED_NOTICE;

  if (showLinkedParent && linkedParent) {
    return (
      <section className="mt-2 space-y-2" aria-label="Linked group outing">
        <ActivityLinkedParentPlanAffordance parent={linkedParent} className="mt-0" />
        {isRideHost && publishingTenantId ? (
          <div>
            {notice ? (
              <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm leading-snug text-red-700" role="status">
                {notice}
              </p>
            ) : null}
            <button
              type="button"
              disabled={unlinking}
              onClick={() => void handleUnlink()}
              className="w-full rounded-xl border border-sky-200 bg-white py-2.5 text-sm font-semibold text-sky-900 disabled:opacity-50"
            >
              {unlinking ? 'Unlinking…' : HOSTING_RIDESHARE_UNLINK_LABEL}
            </button>
          </div>
        ) : null}
      </section>
    );
  }

  if (isRideHost && publishingTenantId) {
    return (
      <section className="mt-2" aria-label="Link to group outing">
        {notice ? (
          <p
            className={`mb-2 rounded-lg px-3 py-2 text-sm leading-snug ${
              notice === HOSTING_RIDESHARE_LINKED_NOTICE ||
              notice === HOSTING_RIDESHARE_UNLINKED_NOTICE
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'bg-red-50 text-red-700'
            }`}
            role="status"
          >
            {notice}
          </p>
        ) : null}
        <LinkParentActivityPanel
          tenantId={publishingTenantId}
          rideshareActivityId={activity.id}
          onLinked={() => {
            setNotice(HOSTING_RIDESHARE_LINKED_NOTICE);
            onParentLinked?.();
          }}
          onError={(message) => setNotice(message)}
        />
      </section>
    );
  }

  return (
    <p className="mt-2 text-sm leading-relaxed text-neutral-600" role="status">
      {ACTIVITY_DETAIL_RIDESHARE_UNLINKED_GUEST}
    </p>
  );
};
