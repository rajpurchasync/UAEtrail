import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, ChevronRight, CheckCircle2, Car } from 'lucide-react';
import type { ActivityDetailDTO, MyActivityRequestDTO, ActivityParticipationDTO } from '@uaetrail/shared-types';
import { activityJoinCtaLabel } from '@uaetrail/shared-types';
import { formatDate } from '../../utils';
import {
  formatPackagePrice,
  inferActivityPricingMode,
  activityPriceLabel,
  activityPricingBadge,
  activityPricingModeLabel,
} from '../../utils/activityPricing';
import { showTenantBrand, activityHostAvatar, activityHostName, activityHostUserId } from '../../utils/hostLabels';
import { resolveOrganisationProfilePath } from '../../utils/organisationLinks';
import { activityDetailEyebrow } from '../../config/activityTypes';
import { detailBackPath } from '../../config/routingCatalog';
import { PARTICIPANT_PRIVACY } from '../../config/platform';
import { buildGoogleDriveUrl, buildGoogleMapsSearchUrl, buildWazeDriveUrl } from '../../utils/mapLinks';
import { MobileDetailShell } from '../mobile/MobileDetailShell';
import {
  ShareButton,
  MeetingPointMap,
  ParticipantPreview,
  HostMessageButton,
  ActivityCheckInPanel,
  SecureAvatar,
  JoinRequestActions,
} from '../ui';
import { resolveJoinRequestUiState } from '../../utils/joinRequestUi';
import {
  extractJoinInstructionLines,
  extractNonJoinRequirements,
  MANDATORY_INSTRUCTIONS_LABEL,
} from '../../utils/joinInstructions';
import { activityRegistryPlacePath } from '../../utils/activityRegistryPlacePath';
import { linkedParentRidesharePeekCopy } from '../../explore/exploreLinkedParentRideshareCopy';
import { ActivityInviteSharePanel } from './ActivityInviteSharePanel';
import { buildActivitySharePayload } from '../../utils/activityShare';
import { EXPLORE_RIDESHARE_AVAILABLE_LABEL } from '../../explore/createFlowCopy';

const GoogleMapsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path d="M12 2.2C8.2 2.2 5.1 5.3 5.1 9.1c0 4.8 6.9 12.7 6.9 12.7s6.9-7.9 6.9-12.7c0-3.8-3.1-6.9-6.9-6.9Z" fill="#EA4335" />
    <path d="M12 2.2v19.6s6.9-7.9 6.9-12.7c0-3.8-3.1-6.9-6.9-6.9Z" fill="#FBBC05" />
    <path d="M12 2.2C8.2 2.2 5.1 5.3 5.1 9.1c0 4.8 6.9 12.7 6.9 12.7V2.2Z" fill="#34A853" />
    <circle cx="12" cy="9.1" r="3" fill="#4285F4" />
  </svg>
);

const WazeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      d="M12.2 3.2c-4.4 0-8 3.4-8 7.6 0 2.3.9 4.1 2.5 5.5.3.2.3.7.1 1l-.7 1.3c-.2.3 0 .8.4.8h5.2c4.7 0 8.5-3.6 8.5-8.1 0-4.5-3.6-8.1-8-8.1Z"
      fill="#ffffff"
      stroke="#2F3A45"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9.4" cy="10" r="1" fill="#2F3A45" />
    <circle cx="14" cy="10" r="1" fill="#2F3A45" />
    <path d="M8.5 12.8c.9.9 2 1.3 3.1 1.3 1.2 0 2.2-.4 3.1-1.3" fill="none" stroke="#2F3A45" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="8.4" cy="18.2" r="1.8" fill="#ffffff" stroke="#2F3A45" strokeWidth="1.5" />
    <circle cx="14.7" cy="18.2" r="1.8" fill="#ffffff" stroke="#2F3A45" strokeWidth="1.5" />
  </svg>
);

export interface ActivityDetailViewProps {
  activity: ActivityDetailDTO;
  previewMode?: boolean;
  backTo?: string;
  backLabel?: string;
  participation?: ActivityParticipationDTO | null;
  myRequest?: MyActivityRequestDTO | null;
  message?: string | null;
  error?: string | null;
  onJoin?: () => void;
  onWithdraw?: () => void;
  footerOverride?: ReactNode;
  sidebarJoinOverride?: ReactNode;
  /** Shown above check-in when user is a confirmed participant (e.g. chat, push). */
  confirmedExtras?: ReactNode;
  confirmedSidebarExtras?: ReactNode;
  selectedPackageIndex?: number;
  onSelectedPackageIndexChange?: (index: number) => void;
  joinDisabled?: boolean;
}

export const ActivityDetailView = ({
  activity,
  previewMode = false,
  backTo = detailBackPath('activity'),
  backLabel = 'Explore',
  participation = null,
  myRequest = null,
  message = null,
  error = null,
  onJoin,
  onWithdraw,
  footerOverride,
  sidebarJoinOverride,
  confirmedExtras,
  confirmedSidebarExtras,
  selectedPackageIndex: controlledPackageIndex,
  onSelectedPackageIndexChange,
  joinDisabled,
}: ActivityDetailViewProps) => {
  const [internalPackageIndex, setInternalPackageIndex] = useState(0);
  const selectedPackageIndex = controlledPackageIndex ?? internalPackageIndex;
  const setSelectedPackageIndex = (index: number) => {
    if (controlledPackageIndex === undefined) {
      setInternalPackageIndex(index);
    }
    onSelectedPackageIndexChange?.(index);
  };

  const pricePackages = activity.pricePackages?.filter((p) => p.label.trim()) ?? [];
  const hasMultiplePackages = pricePackages.length > 1;
  const pricingMode = inferActivityPricingMode(activity);
  const pricingBadge = activityPricingBadge(activity);
  const packageSelected = !hasMultiplePackages || selectedPackageIndex >= 0;
  const joinActionDisabled = joinDisabled ?? !packageSelected;

  const heroImage =
    activity.images?.[0] ??
    activity.location?.images?.[0] ??
    (activity.activityType === 'camping'
      ? 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1600'
      : activity.activityType === 'event'
        ? 'https://images.unsplash.com/photo-1452626038306-9fff603b72e5?w=1600'
        : 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600');

  const externalSignupUrl = activity.signupUrl?.trim() || null;
  const usesExternalSignup = Boolean(externalSignupUrl) && !previewMode;

  const participants = activity.participants ?? [];
  const previewParticipants = PARTICIPANT_PRIVACY.showPreJoin ? participants : [];
  const hostPath = previewMode
    ? null
    : resolveOrganisationProfilePath({
        tenantSlug: activity.tenantSlug,
        hostUserId: activityHostUserId(activity),
      });
  const hostProfileHint = activity.tenantSlug
    ? 'Runs this activity · view host profile'
    : 'Runs this activity · view profile';
  const isFull = (activity.slotsAvailable ?? 0) <= 0;
  const accessLat =
    activity.startLat ?? activity.meetingLat ?? activity.parkingLat ?? activity.location?.latitude ?? null;
  const accessLng =
    activity.startLng ?? activity.meetingLng ?? activity.parkingLng ?? activity.location?.longitude ?? null;
  const hasAccessCoordinates = accessLat != null && accessLng != null;
  const registryPlacePath = previewMode ? null : activityRegistryPlacePath(activity);
  const registryPlaceName = activity.location?.name?.trim() || activity.locationName?.trim() || null;
  const openInGoogleMapsUrl =
    activity.location?.parkingLink ?? (hasAccessCoordinates ? buildGoogleMapsSearchUrl(accessLat, accessLng) : null);

  const dateRangeLabel = activity.endDate
    ? `${formatDate(activity.date)} – ${formatDate(activity.endDate)}`
    : formatDate(activity.date);

  const sharePayload = buildActivitySharePayload({
    id: activity.id,
    title: activity.title || activity.locationName,
    activityType: activity.activityType,
    date: activity.date,
    locationName: activity.locationName,
  });

  const showInviteShare =
    !previewMode && activity.status === 'published' && activity.visibilityState !== 'private';

  const joinLabel = usesExternalSignup
    ? 'Sign up / Join'
    : activityJoinCtaLabel({
        participationMode: activity.participationMode,
        requirements: activity.requirements,
        isFull,
      });

  const handleJoinClick = () => {
    if (usesExternalSignup && externalSignupUrl) {
      window.open(externalSignupUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    onJoin?.();
  };
  const joinUiState = resolveJoinRequestUiState({ myRequest, participation });

  const previewFooter = (
    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-center">
      <p className="text-sm font-semibold text-amber-900">Draft preview</p>
      <p className="text-xs text-amber-800 mt-1">This is how your activity will look once published.</p>
    </div>
  );

  const checkInFooter =
    participation ? (
      <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200/80 p-3 shadow-lg space-y-2">
        {confirmedExtras}
        <ActivityCheckInPanel participation={participation} />
        {(joinUiState.kind === 'pending' || joinUiState.kind === 'confirmed') && onWithdraw && (
          <JoinRequestActions
            uiState={joinUiState}
            joinLabel={joinLabel}
            isFull={isFull}
            onWithdraw={onWithdraw}
            joinButtonClassName="ios-btn shadow-lg"
          />
        )}
      </div>
    ) : joinUiState.kind !== 'open' && onWithdraw ? (
      <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200/80 p-3 shadow-lg">
        <JoinRequestActions
          uiState={joinUiState}
          joinLabel={joinLabel}
          isFull={isFull}
          onWithdraw={onWithdraw}
          joinButtonClassName="ios-btn shadow-lg"
        />
      </div>
    ) : null;

  const joinButton =
    footerOverride ??
    (previewMode
      ? previewFooter
      : checkInFooter ?? (
          <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200/80 p-3 shadow-lg">
            <JoinRequestActions
              uiState={joinUiState}
              joinLabel={joinLabel}
              isFull={isFull}
              onJoin={handleJoinClick}
              onWithdraw={onWithdraw}
              joinDisabled={joinActionDisabled}
              joinButtonClassName="ios-btn shadow-lg"
            />
          </div>
        ));

  const sidebarJoin =
    sidebarJoinOverride ??
    (previewMode ? (
      <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        Preview only — join is disabled until you publish.
      </p>
    ) : participation ? (
      <>
        {confirmedSidebarExtras ?? confirmedExtras}
        <ActivityCheckInPanel participation={participation} />
        {(joinUiState.kind === 'pending' || joinUiState.kind === 'confirmed') && onWithdraw && (
          <JoinRequestActions
            uiState={joinUiState}
            joinLabel={joinLabel}
            isFull={isFull}
            onWithdraw={onWithdraw}
          />
        )}
      </>
    ) : joinUiState.kind !== 'open' && onWithdraw ? (
      <JoinRequestActions
        uiState={joinUiState}
        joinLabel={joinLabel}
        isFull={isFull}
        onWithdraw={onWithdraw}
      />
    ) : (
      <button
        type="button"
        onClick={handleJoinClick}
        disabled={joinActionDisabled}
        className={`hidden md:block w-full mt-4 px-4 py-3 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-colors ${
          isFull ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
      >
        {joinLabel}
      </button>
    ));

  return (
    <MobileDetailShell
      backTo={backTo}
      backLabel={backLabel}
      footer={joinButton}
      headerAction={
        showInviteShare ? (
          <ShareButton
            title={sharePayload.title}
            text={sharePayload.text}
            path={sharePayload.path}
            iconOnly
            light
          />
        ) : undefined
      }
      banner={{
        src: heroImage,
        alt: activity.title || activity.locationName,
        title: activity.title || activity.locationName,
        eyebrow: activityDetailEyebrow(activity.activityType),
        showMobileChrome: !previewMode,
        showJourney: !previewMode,
        journeyFallbackTo: backTo,
        journeyLabel: backLabel,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {showInviteShare ? (
            <ActivityInviteSharePanel
              activity={{
                id: activity.id,
                title: activity.title || activity.locationName,
                activityType: activity.activityType,
                date: activity.date,
                locationName: activity.locationName,
              }}
            />
          ) : null}

          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">About this {activity.activityType === 'event' ? 'event' : 'activity'}</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{activity.description}</p>

            {registryPlacePath && registryPlaceName && (
              <Link
                to={registryPlacePath}
                className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{registryPlaceName}</p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    Venue details — toilets, fuel, shops, access
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
              </Link>
            )}

            {externalSignupUrl && (
              <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                <p className="text-sm font-medium text-violet-900">Registration</p>
                <p className="text-xs text-violet-800 mt-1">
                  Sign up on the host&apos;s external page to secure your spot.
                </p>
                <a
                  href={externalSignupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex mt-2 text-sm font-semibold text-violet-700 hover:text-violet-900 underline underline-offset-2"
                >
                  Open signup link
                </a>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-gray-50 rounded-xl p-3">
                <Calendar className="w-4 h-4 text-emerald-600 mb-1" />
                <p className="text-xs text-gray-500">Start</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(activity.date)}</p>
              </div>
              {activity.endDate && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <Calendar className="w-4 h-4 text-emerald-600 mb-1" />
                  <p className="text-xs text-gray-500">End</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(activity.endDate)}</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-3">
                <Clock className="w-4 h-4 text-emerald-600 mb-1" />
                <p className="text-xs text-gray-500">Time</p>
                <p className="text-sm font-semibold text-gray-900">
                  {activity.time}
                  {activity.endTime ? ` – ${activity.endTime}` : ''}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <Users className="w-4 h-4 text-emerald-600 mb-1" />
                <p className="text-xs text-gray-500">Spots</p>
                <p className="text-sm font-semibold text-gray-900">
                  {activity.slotsAvailable}/{activity.slotsTotal} left
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Pricing</p>
                <p className={`text-sm font-semibold inline-flex px-2 py-0.5 rounded-lg ${pricingBadge.bg} ${pricingBadge.text}`}>
                  {activityPricingModeLabel(activity)}
                </p>
                {pricingMode !== 'free' && (
                  <p className="text-sm font-semibold text-gray-900 mt-1">{activityPriceLabel(activity)}</p>
                )}
              </div>
            </div>

            {pricePackages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Join options</h3>
                <div className="space-y-2">
                  {pricePackages.map((pkg, index) => (
                    <label
                      key={`${pkg.label}-${index}`}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                        previewMode ? '' : 'cursor-pointer'
                      } transition-colors ${
                        hasMultiplePackages && selectedPackageIndex === index
                          ? 'border-emerald-500 bg-emerald-50'
                          : hasMultiplePackages
                            ? 'border-gray-200 hover:border-gray-300'
                            : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      {hasMultiplePackages ? (
                        <>
                          <span className="flex items-center gap-3 min-w-0">
                            <input
                              type="radio"
                              name="activity-package"
                              checked={selectedPackageIndex === index}
                              onChange={() => setSelectedPackageIndex(index)}
                              disabled={previewMode}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-800">{pkg.label}</span>
                          </span>
                          <span className="text-sm font-semibold text-gray-900 shrink-0">
                            {formatPackagePrice(pkg)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-gray-800">{pkg.label}</span>
                          <span className="text-sm font-semibold text-gray-900">{formatPackagePrice(pkg)}</span>
                        </>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {(activity.startPoint || activity.meetingPoint || activity.parkingPoint || openInGoogleMapsUrl || hasAccessCoordinates) && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <Car className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-3 w-full">
                    <p className="text-sm font-semibold text-gray-900">Access details</p>
                    {(activity.startPoint || activity.meetingPoint || activity.parkingPoint) && (
                      <div className="space-y-1 text-sm text-gray-700">
                        {activity.startPoint && (
                          <p>
                            <span className="font-medium text-gray-900">Hike start point:</span> {activity.startPoint}
                          </p>
                        )}
                        {activity.meetingPoint && (
                          <p>
                            <span className="font-medium text-gray-900">Meeting point:</span> {activity.meetingPoint}
                            <span className="block text-xs font-normal text-gray-500 mt-0.5">
                              Information only — not a join requirement.
                            </span>
                          </p>
                        )}
                        {activity.parkingPoint && (
                          <p>
                            <span className="font-medium text-gray-900">Parking:</span> {activity.parkingPoint}
                          </p>
                        )}
                      </div>
                    )}
                    {hasAccessCoordinates && !previewMode && (
                      <MeetingPointMap
                        lat={accessLat}
                        lng={accessLng}
                        label={activity.meetingPoint ?? activity.parkingPoint ?? activity.locationName}
                        hideExternalLink
                      />
                    )}
                    {hasAccessCoordinates && previewMode && (
                      <a
                        href={buildGoogleMapsSearchUrl(accessLat, accessLng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-800"
                      >
                        View location on Google Maps →
                      </a>
                    )}
                    {!previewMode && (
                      <div className="flex flex-wrap gap-2">
                        {openInGoogleMapsUrl && (
                          <a
                            href={openInGoogleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"
                          >
                            <GoogleMapsIcon className="h-4 w-4" />
                            Open with Google Maps
                          </a>
                        )}
                        {hasAccessCoordinates && (
                          <>
                            <a
                              href={buildGoogleDriveUrl(accessLat, accessLng)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"
                            >
                              <GoogleMapsIcon className="h-4 w-4" />
                              Drive with Google Maps
                            </a>
                            <a
                              href={buildWazeDriveUrl(accessLat, accessLng)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100"
                            >
                              <WazeIcon className="h-4 w-4" />
                              Drive with Waze
                            </a>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activity.rideshareEnabled && (
              <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
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
                    {activity.rideshareDetails && (
                      <p className="text-gray-600 mt-1 whitespace-pre-line">{activity.rideshareDetails}</p>
                    )}
                    {activity.linkedRideshare && (
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
                    )}
                  </div>
                </div>
              </div>
            )}

            {activity.linkedParentActivity && (() => {
              const parent = activity.linkedParentActivity;
              const linkedCopy = linkedParentRidesharePeekCopy(parent.activityType, parent.title);
              return (
                <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">{linkedCopy.eyebrow}</p>
                  {linkedCopy.showTitleSubtitle ? (
                    <p className="mt-1 text-gray-800">{parent.title}</p>
                  ) : null}
                  <Link
                    to={`/activity/${parent.id}`}
                    className="mt-2 inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-800"
                  >
                    View outing
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              );
            })()}
          </div>

          {activity.itinerary && activity.itinerary.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Itinerary</h2>
              <ul className="space-y-2">
                {activity.itinerary.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(() => {
            const mandatoryInstructions = extractJoinInstructionLines(activity.requirements);
            const otherRequirements = extractNonJoinRequirements(activity.requirements);
            return (
              <>
                {mandatoryInstructions.length > 0 && (
                  <div className="bg-white rounded-2xl border border-amber-100 p-5 sm:p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">{MANDATORY_INSTRUCTIONS_LABEL}</h2>
                    <p className="text-xs text-gray-500 mb-3">Joiners must agree to these when requesting a spot.</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      {mandatoryInstructions.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {otherRequirements.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Activity details</h2>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      {otherRequirements.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            );
          })()}

          {activity.images && activity.images.length > 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {activity.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="rounded-xl aspect-video object-cover" />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 lg:sticky lg:top-20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-bold text-gray-900">{activityPriceLabel(activity)}</p>
                <p className="text-sm text-gray-500">{pricePackages.length > 1 ? 'options available' : 'per person'}</p>
              </div>
              {!previewMode && (
                <div className="hidden md:block">
                  <ShareButton
                    title={activity.title || activity.locationName}
                    text={`${dateRangeLabel} · Join this ${activity.activityType} activity on UAE Trails`}
                    path={`/activity/${activity.id}`}
                  />
                </div>
              )}
            </div>

            {sidebarJoin}

            {message && <p className="mt-3 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">{message}</p>}
            {error && <p className="mt-3 text-sm text-amber-800 bg-amber-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Host</p>
              <div className="flex items-center gap-2">
                {hostPath ? (
                  <Link to={hostPath} className="flex items-center gap-3 group flex-1 min-w-0">
                    <SecureAvatar
                      src={activityHostAvatar(activity)}
                      name={activityHostName(activity)}
                      className="w-11 h-11 text-sm ring-2 ring-emerald-50 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-emerald-700 truncate">
                        {activityHostName(activity)}
                      </p>
                      {showTenantBrand(activity) && activity.tenantName && (
                        <p className="text-xs text-gray-500 truncate">{activity.tenantName}</p>
                      )}
                      <p className="text-xs text-gray-500">{hostProfileHint}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <SecureAvatar
                      src={activityHostAvatar(activity)}
                      name={activityHostName(activity)}
                      className="w-11 h-11 text-sm ring-2 ring-emerald-50 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">{activityHostName(activity)}</p>
                      {showTenantBrand(activity) && activity.tenantName && (
                        <p className="text-xs text-gray-500 truncate">{activity.tenantName}</p>
                      )}
                    </div>
                  </div>
                )}
                {!previewMode && (
                  <HostMessageButton hostUserId={activityHostUserId(activity)} activityId={activity.id} size="md" />
                )}
              </div>
              {activity.hostBio && <p className="mt-3 text-sm text-gray-600 leading-relaxed">{activity.hostBio}</p>}
            </div>

            {PARTICIPANT_PRIVACY.showPreJoin && !previewMode && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Who&apos;s going ({participants.length})
                </p>
                <ParticipantPreview
                  participants={previewParticipants}
                  size="md"
                  showNames
                  linkToProfile
                  emptyLabel="No confirmed participants yet — be the first to join!"
                />
                {previewParticipants.length > 0 && (
                  <p className="mt-2 text-[11px] text-gray-400">Tap a name to view profile</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MobileDetailShell>
  );
};
