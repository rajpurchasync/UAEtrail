import { Users } from 'lucide-react';
import type { ActivityGroupChatPostPolicy } from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../../../../api/index';
import { ACTIVITY_DETAIL_CREW_LOCKED_HINT, ACTIVITY_DETAIL_HOST_BUDDIES_TOOLS_HINT } from '../../../../content/activityDetailCopy';
import { ActivityDetailHostBuddiesHub } from '../ActivityDetailHostBuddiesHub';

type ActivityDetailBuddiesAsideProps = {
  panelClassName: string;
  previewMode: boolean;
  showMobileTabs: boolean;
  showCrewLockedHint: boolean;
  activityId: string;
  activityTitle: string;
  hostBuddiesHub?: {
    joinRequests: ActivityRequestView[];
    requestsLoading: boolean;
    onRequestsChanged: () => void | Promise<void>;
  };
  hostCrewChatPolicy?: {
    tenantId: string;
    onSaved?: (policy: ActivityGroupChatPostPolicy) => void;
    onError?: (message: string) => void;
  };
};

export const ActivityDetailBuddiesAside = ({
  panelClassName,
  previewMode,
  showMobileTabs,
  showCrewLockedHint,
  activityId,
  activityTitle,
  hostBuddiesHub,
  hostCrewChatPolicy,
}: ActivityDetailBuddiesAsideProps) => (
  <>
    {hostBuddiesHub && hostCrewChatPolicy && !previewMode ? (
      <div className={`space-y-2 ${panelClassName}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {ACTIVITY_DETAIL_HOST_BUDDIES_TOOLS_HINT}
        </p>
        <ActivityDetailHostBuddiesHub
          tenantId={hostCrewChatPolicy.tenantId}
          activityId={activityId}
          activityTitle={activityTitle}
          joinRequests={hostBuddiesHub.joinRequests}
          requestsLoading={hostBuddiesHub.requestsLoading}
          onRequestsChanged={hostBuddiesHub.onRequestsChanged}
          onError={hostCrewChatPolicy.onError}
        />
      </div>
    ) : null}
    {showCrewLockedHint && showMobileTabs ? (
      <div className={`md:hidden bg-white rounded-2xl border border-gray-100 p-6 text-center ${panelClassName}`}>
        <Users className="mx-auto h-8 w-8 text-neutral-400" aria-hidden />
        <p className="mt-3 text-sm text-neutral-600 leading-relaxed">{ACTIVITY_DETAIL_CREW_LOCKED_HINT}</p>
      </div>
    ) : null}
  </>
);
