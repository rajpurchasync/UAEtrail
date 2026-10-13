import { Link } from 'react-router-dom';
import { Car, ChevronRight } from 'lucide-react';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import {
  DirectionsControl,
  MeetingPointMap,
  ViewOnMapLink,
} from '../../../ui';
import {
  ACTIVITY_DETAIL_PLACE_LOCKED_BODY,
  ACTIVITY_DETAIL_PLACE_LOCKED_CTA,
} from '../../../../content/activityDetailCopy';
import type { ActivityDetailTabId } from '../../../../activity/activityDetailTab';

type ActivityDetailPlaceTabPanelsProps = {
  panelClassName: string;
  activity: ActivityDetailDTO;
  previewMode: boolean;
  showMobileTabs: boolean;
  showPlaceCrewBody: boolean;
  showPlaceLockedOnMobile?: boolean;
  registryPlacePath: string | null;
  registryPlaceName: string | null;
  hasAccessCoordinates: boolean;
  accessLat: number | null;
  accessLng: number | null;
  openInGoogleMapsUrl: string | null;
  onMobileTabChange?: (tab: ActivityDetailTabId) => void;
};

export const ActivityDetailPlaceTabPanels = ({
  panelClassName,
  activity,
  previewMode,
  showMobileTabs,
  showPlaceCrewBody,
  showPlaceLockedOnMobile,
  registryPlacePath,
  registryPlaceName,
  hasAccessCoordinates,
  accessLat,
  accessLng,
  onMobileTabChange,
}: ActivityDetailPlaceTabPanelsProps) => (
  <>
    {registryPlacePath && registryPlaceName ? (
      <div className={`bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 ${panelClassName}`}>
        <Link
          to={registryPlacePath}
          className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{registryPlaceName}</p>
            <p className="mt-0.5 text-xs text-gray-600">Venue guide</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
        </Link>
      </div>
    ) : null}

    {(showPlaceLockedOnMobile ?? (!showPlaceCrewBody && showMobileTabs)) ? (
      <div className={`bg-white rounded-2xl border border-gray-100 p-6 text-center ${panelClassName}`}>
        <Car className="mx-auto h-8 w-8 text-neutral-400" aria-hidden />
        <p className="mt-3 text-sm text-neutral-600 leading-relaxed">{ACTIVITY_DETAIL_PLACE_LOCKED_BODY}</p>
        {onMobileTabChange ? (
          <button
            type="button"
            onClick={() => onMobileTabChange('plan')}
            className="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {ACTIVITY_DETAIL_PLACE_LOCKED_CTA}
          </button>
        ) : null}
      </div>
    ) : null}

    {showPlaceCrewBody &&
    (activity.startPoint ||
      activity.meetingPoint ||
      activity.parkingPoint ||
      hasAccessCoordinates) && (
      <div className={`bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 ${panelClassName}`}>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start gap-3">
            <Car className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-3 w-full">
              <p className="text-sm font-semibold text-gray-900">Access details</p>
              {(activity.startPoint || activity.meetingPoint || activity.parkingPoint) && (
                <div className="space-y-1 text-sm text-gray-700">
                  {activity.startPoint ? (
                    <p>
                      <span className="font-medium text-gray-900">Hike start point:</span> {activity.startPoint}
                    </p>
                  ) : null}
                  {activity.meetingPoint ? (
                    <p>
                      <span className="font-medium text-gray-900">Meeting point:</span> {activity.meetingPoint}
                      <span className="block text-xs font-normal text-gray-500 mt-0.5">
                        Information only — not a join requirement.
                      </span>
                    </p>
                  ) : null}
                  {activity.parkingPoint ? (
                    <p>
                      <span className="font-medium text-gray-900">Parking:</span> {activity.parkingPoint}
                    </p>
                  ) : null}
                </div>
              )}
              {hasAccessCoordinates && accessLat != null && accessLng != null && !previewMode ? (
                <MeetingPointMap
                  lat={accessLat}
                  lng={accessLng}
                  label={activity.meetingPoint ?? activity.parkingPoint ?? activity.locationName}
                  hideExternalLink
                />
              ) : null}
              {hasAccessCoordinates && accessLat != null && accessLng != null && previewMode ? (
                <ViewOnMapLink
                  lat={accessLat}
                  lng={accessLng}
                  className="inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                  View location on Google Maps →
                </ViewOnMapLink>
              ) : null}
              {hasAccessCoordinates && accessLat != null && accessLng != null && !previewMode ? (
                <DirectionsControl lat={accessLat} lng={accessLng} variant="compact" />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    )}
  </>
);
