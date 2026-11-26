import { useState } from 'react';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { ActivityLinkedParentPlanAffordance } from '../../../components/activity/ActivityLinkedParentPlanAffordance';
import {
  ACTIVITY_DETAIL_RIDESHARE_UNLINKED_GUEST,
  HOSTING_RIDESHARE_LINKED_NOTICE,
} from '@/discovery/discoveryPortExploreCreateFlowCopy';
import { LinkParentActivityPanel } from '@/discovery/discoveryPortExploreLinkRideshareUi';
import { resolveActivityLinkedParentSummary } from '../../../activity/resolveActivityLinkageSummaries';

export type ActivityDetailRideshareLinkageProps = {
  activity: ActivityDetailDTO;
  isRideHost: boolean;
  hostTenantId: string | null;
  onParentLinked?: () => void;
};

/** Rideshare consumer detail — parent plan link or host link flow. */
export const ActivityDetailRideshareLinkage = ({
  activity,
  isRideHost,
  hostTenantId,
  onParentLinked,
}: ActivityDetailRideshareLinkageProps) => {
  const [notice, setNotice] = useState<string | null>(null);
  const linkedParent = resolveActivityLinkedParentSummary(activity);

  if (linkedParent) {
    return (
      <section className="mt-2" aria-label="Linked group outing">
        <ActivityLinkedParentPlanAffordance parent={linkedParent} className="mt-0" />
      </section>
    );
  }

  if (isRideHost && hostTenantId) {
    return (
      <section className="mt-2" aria-label="Link to group outing">
        {notice ? (
          <p
            className={`mb-2 rounded-lg px-3 py-2 text-sm leading-snug ${
              notice === HOSTING_RIDESHARE_LINKED_NOTICE
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'bg-red-50 text-red-700'
            }`}
            role="status"
          >
            {notice}
          </p>
        ) : null}
        <LinkParentActivityPanel
          tenantId={hostTenantId}
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
