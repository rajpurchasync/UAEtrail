import { Users } from 'lucide-react';
import type { ActivityGroupChatPostPolicy } from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../../../../api/types';
import {
  ACTIVITY_DETAIL_CREW_LOCKED_HINT,
  ACTIVITY_DETAIL_HOST_CREW_TOOLS_HINT,
} from '../../../../content/activityDetailCopy';
import { ActivityDetailHostCrewHub } from '../ActivityDetailHostCrewHub';

type ActivityDetailCrewAsideProps = {
  panelClassName: string;
  previewMode: boolean;
  showMobileTabs: boolean;
  showCrewLockedHint: boolean;
  activityId: string;
  activityTitle: string;
  activityType?: string;
  rideshareHasPayment?: boolean;
  hostCrewHub?: {
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

export const ActivityDetailCrewAside = ({
  panelClassName,
  previewMode,
  showMobileTabs,
  showCrewLockedHint,
  activityId,
  activityTitle,
  activityType,
  rideshareHasPayment = false,
  hostCrewHub,
  hostCrewChatPolicy,
}: ActivityDetailCrewAsideProps) => (
  <>
    {hostCrewHub && hostCrewChatPolicy && !previewMode ? (
      <div className={`space-y-2 ${panelClassName}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {ACTIVITY_DETAIL_HOST_CREW_TOOLS_HINT}
        </p>
        <ActivityDetailHostCrewHub
          tenantId={hostCrewChatPolicy.tenantId}
          activityId={activityId}
          activityTitle={activityTitle}
          activityType={activityType}
          rideshareHasPayment={rideshareHasPayment}
          joinRequests={hostCrewHub.joinRequests}
          requestsLoading={hostCrewHub.requestsLoading}
          onRequestsChanged={hostCrewHub.onRequestsChanged}
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