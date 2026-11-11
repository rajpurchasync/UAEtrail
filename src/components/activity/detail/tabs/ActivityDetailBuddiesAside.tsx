import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import type { ActivityRequestView } from '../../../../api/types';
import { activityCrewPath } from '../../../../config/routingCatalog';
import {
  ACTIVITY_DETAIL_CREW_LOCKED_HINT,
  ACTIVITY_DETAIL_HOST_BUDDIES_TOOLS_HINT,
} from '../../../../content/activityDetailCopy';
import {
  ACTIVITY_PARTICIPANTS_HOST_MANAGE_HINT,
  ACTIVITY_PARTICIPANTS_SECTION_LABEL,
} from '../../../../content/activityParticipantsCopy';

type ActivityDetailBuddiesAsideProps = {
  panelClassName: string;
  previewMode: boolean;
  showMobileTabs: boolean;
  showCrewLockedHint: boolean;
  activityId: string;
  hostBuddiesHub?: {
    joinRequests: ActivityRequestView[];
  };
  hostCrewChatPolicy?: {
    tenantId: string;
  };
};

export const ActivityDetailBuddiesAside = ({
  panelClassName,
  previewMode,
  showMobileTabs,
  showCrewLockedHint,
  activityId,
  hostBuddiesHub,
  hostCrewChatPolicy,
}: ActivityDetailBuddiesAsideProps) => (
  <>
    {hostBuddiesHub && hostCrewChatPolicy && !previewMode ? (
      <div className={`space-y-2 ${panelClassName}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {ACTIVITY_DETAIL_HOST_BUDDIES_TOOLS_HINT}
        </p>
        <Link
          to={activityCrewPath(activityId)}
          className="block rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 shadow-sm"
        >
          <span className="text-sm font-semibold text-neutral-900">{ACTIVITY_PARTICIPANTS_SECTION_LABEL}</span>
          <span className="mt-0.5 block text-sm text-neutral-600">
            {ACTIVITY_PARTICIPANTS_HOST_MANAGE_HINT}
            {hostBuddiesHub.joinRequests.length > 0
              ? ` ${hostBuddiesHub.joinRequests.length} waiting.`
              : ''}
          </span>
        </Link>
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
