import { Link } from 'react-router-dom';
import { Car, ChevronRight } from 'lucide-react';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { EXPLORE_RIDESHARE_AVAILABLE_LABEL } from '../../../../explore/createFlowCopy';
import { linkedParentRidesharePeekCopy } from '../../../../explore/exploreLinkedParentRideshareCopy';
import {
  ACTIVITY_DETAIL_PLAN_SUSTAINABILITY_LINE,
  ACTIVITY_DETAIL_TRANSPORT_EMPTY_HINT,
  ACTIVITY_DETAIL_TRANSPORT_PRO_HOST_HINT,
  ACTIVITY_DETAIL_TRANSPORT_PRO_PARTICIPANT_HINT,
  ACTIVITY_DETAIL_TRANSPORT_REACH_TITLE,
} from '../../../../content/activityDetailCopy';
import { PRO_MEMBERSHIP_PATH } from '../../../../config/routingCatalog';

type ActivityDetailTransportTabPanelsProps = {
  panelClassName: string;
  activity: ActivityDetailDTO;
  transportReachLines: string[];
  showTransportEncouragementMobile: boolean;
  showTransportHostProUpsell: boolean;
  showTransportParticipantProUpsell: boolean;
};

export const ActivityDetailTransportTabPanels = ({
  panelClassName,
  activity,
  transportReachLines,
  showTransportEncouragementMobile,
  showTransportHostProUpsell,
  showTransportParticipantProUpsell,
}: ActivityDetailTransportTabPanelsProps) => (
  <>
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 ${panelClassName}`}>
      <h2 className="text-lg font-bold text-gray-900 mb-2">{ACTIVITY_DETAIL_TRANSPORT_REACH_TITLE}</h2>
      {transportReachLines.length > 0 ? (
        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
          {transportReachLines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 leading-relaxed">
          {activity.meetingPoint || activity.parkingPoint
            ? 'Meeting and parking notes are on Place once you join.'
            : 'Reach-by details appear here when the host adds them.'}
        </p>
      )}
      <p className="mt-3 text-xs text-gray-500 leading-relaxed">{ACTIVITY_DETAIL_PLAN_SUSTAINABILITY_LINE}</p>
    </div>

    {showTransportEncouragementMobile ? (
      <div
        className={`md:hidden rounded-2xl border border-neutral-100 bg-white p-6 text-center ${panelClassName}`}
      >
        <Car className="mx-auto h-8 w-8 text-neutral-400" aria-hidden />
        <p className="mt-3 text-sm text-neutral-600 leading-relaxed">{ACTIVITY_DETAIL_TRANSPORT_EMPTY_HINT}</p>
        {showTransportHostProUpsell ? (
          <p className="mt-3 text-sm text-neutral-600">
            {ACTIVITY_DETAIL_TRANSPORT_PRO_HOST_HINT}{' '}
            <Link to={PRO_MEMBERSHIP_PATH} className="font-semibold text-emerald-700 hover:text-emerald-800">
              Learn about Pro
            </Link>
          </p>
        ) : null}
        {showTransportParticipantProUpsell ? (
          <p className="mt-3 text-sm text-neutral-600">
            {ACTIVITY_DETAIL_TRANSPORT_PRO_PARTICIPANT_HINT}{' '}
            <Link to={PRO_MEMBERSHIP_PATH} className="font-semibold text-emerald-700 hover:text-emerald-800">
              Learn about Pro
            </Link>
          </p>
        ) : null}
      </div>
    ) : null}

    {activity.rideshareEnabled ? (
      <div className={`rounded-2xl border border-sky-100 bg-sky-50/70 p-4 ${panelClassName}`}>
        <div className="flex items-start gap-2 text-sm text-gray-700">
          <Car className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900">{EXPLORE_RIDESHARE_AVAILABLE_LABEL}</p>
            <p className="mt-1">
              {activity.rideshareSeats != null && activity.rideshareSeats > 0
                ? `${activity.rideshareSeats} seat${activity.rideshareSeats === 1 ? '' : 's'} · `
                : ''}
              {activity.rideshareFree
                ? 'Free shared ride'
                : activity.ridesharePriceAed != null
                  ? `AED ${activity.ridesharePriceAed} per seat`
                  : 'Shared ride'}
            </p>
            {activity.rideshareDetails ? (
              <p className="text-gray-600 mt-1 whitespace-pre-line">{activity.rideshareDetails}</p>
            ) : null}
            {activity.linkedRideshare ? (
              <div className="mt-3 rounded-xl border border-sky-200 bg-white px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                  Linked rideshare listing
                </p>
                <p className="mt-1 text-sm text-gray-800">
                  {activity.linkedRideshare.meetingPoint && activity.linkedRideshare.startPoint
                    ? `${activity.linkedRideshare.meetingPoint} → ${activity.linkedRideshare.startPoint}`
                    : activity.linkedRideshare.title}
                </p>
                <Link
                  to={`/activity/${activity.linkedRideshare.id}`}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:text-sky-800"
                >
                  View rideshare details
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ) : null}

    {activity.linkedParentActivity ? (() => {
      const parent = activity.linkedParentActivity;
      const linkedCopy = linkedParentRidesharePeekCopy(parent.activityType, parent.title);
      return (
        <div className={`rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-sm text-gray-700 ${panelClassName}`}>
          <p className="font-semibold text-gray-900">{linkedCopy.eyebrow}</p>
          {linkedCopy.showTitleSubtitle ? <p className="mt-1 text-gray-800">{parent.title}</p> : null}
          <Link
            to={`/activity/${parent.id}`}
            className="mt-2 inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-800"
          >
            View outing
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      );
    })() : null}
  </>
);
