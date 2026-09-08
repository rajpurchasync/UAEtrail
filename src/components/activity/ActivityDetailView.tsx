import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, ChevronRight, CheckCircle2, Car } from 'lucide-react';
import type { ActivityDetailDTO, MyTripRequestDTO, TripParticipationDTO } from '@uaetrail/shared-types';
import { formatDate } from '../../utils';
import { formatPackagePrice, inferTripPricingMode, tripPriceLabel, tripPricingBadge, tripPricingModeLabel } from '../../utils/tripPricing';
import { showTenantBrand, activityHostAvatar, activityHostName, activityHostUserId } from '../../utils/hostLabels';
import { hostProfilePath } from '../../utils/hostLinks';
import { activityDetailEyebrow } from '../../config/activityTypes';
import { PARTICIPANT_PRIVACY } from '../../config/platform';
import { MobileDetailShell } from '../mobile/MobileDetailShell';
import {
  ShareButton,
  MeetingPointMap,
  ParticipantPreview,
  HostMessageButton,
  ActivityCheckInPanel,
  SecureAvatar,
} from '../ui';

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

const buildGoogleDriveUrl = (lat: number, lng: number): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

const buildGoogleMapsSearchUrl = (lat: number, lng: number): string =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

const buildWazeDriveUrl = (lat: number, lng: number): string =>
  `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

export interface ActivityDetailViewProps {
  trip: ActivityDetailDTO;
  previewMode?: boolean;
  backTo?: string;
  backLabel?: string;
  participation?: TripParticipationDTO | null;
  myRequest?: MyTripRequestDTO | null;
  message?: string | null;
  error?: string | null;
  onJoin?: () => void;
  onWithdraw?: () => void;
  onCheckIn?: (activityId: string) => Promise<TripParticipationDTO>;
  onParticipationUpdated?: (p: TripParticipationDTO) => void;
  footerOverride?: ReactNode;
  sidebarJoinOverride?: ReactNode;
}

export const ActivityDetailView = ({
  trip,
  previewMode = false,
  backTo = '/activities',
  backLabel = 'Activities',
  participation = null,
  myRequest = null,
  message = null,
  error = null,
  onJoin,
  onWithdraw,
  onCheckIn,
  onParticipationUpdated,
  footerOverride,
  sidebarJoinOverride,
}: ActivityDetailViewProps) => {
  const [selectedPackageIndex, setSelectedPackageIndex] = useState(0);

  const pricePackages = trip.pricePackages?.filter((p) => p.label.trim()) ?? [];
  const hasMultiplePackages = pricePackages.length > 1;
  const pricingMode = inferTripPricingMode(trip);
  const pricingBadge = tripPricingBadge(trip);
  const packageSelected = !hasMultiplePackages || selectedPackageIndex >= 0;

  const heroImage =
    trip.images?.[0] ??
    trip.location?.images?.[0] ??
    (trip.activityType === 'camping'
      ? 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1600'
      : trip.activityType === 'event'
        ? 'https://images.unsplash.com/photo-1452626038306-9fff603b72e5?w=1600'
        : 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600');

  const externalSignupUrl = trip.signupUrl?.trim() || null;
  const usesExternalSignup = Boolean(externalSignupUrl) && !previewMode;

  const participants = trip.participants ?? [];
  const previewParticipants = PARTICIPANT_PRIVACY.showPreJoin ? participants : [];
  const hostPath = previewMode ? null : hostProfilePath(trip.tenantSlug);
  const isFull = (trip.slotsAvailable ?? 0) <= 0;
  const accessLat =
    trip.startLat ?? trip.meetingLat ?? trip.parkingLat ?? trip.location?.latitude ?? null;
  const accessLng =
    trip.startLng ?? trip.meetingLng ?? trip.parkingLng ?? trip.location?.longitude ?? null;
  const hasAccessCoordinates = accessLat != null && accessLng != null;
  const openInGoogleMapsUrl =
    trip.location?.parkingLink ?? (hasAccessCoordinates ? buildGoogleMapsSearchUrl(accessLat, accessLng) : null);

  const dateRangeLabel = trip.endDate
    ? `${formatDate(trip.date)} – ${formatDate(trip.endDate)}`
    : formatDate(trip.date);

  const joinLabel = usesExternalSignup
    ? 'Sign up / Join'
    : isFull
      ? 'Join Waitlist'
      : 'Request to Join';

  const handleJoinClick = () => {
    if (usesExternalSignup && externalSignupUrl) {
      window.open(externalSignupUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    onJoin?.();
  };
  const isConfirmed = Boolean(participation);
  const hasActiveRequest = Boolean(myRequest?.canWithdraw);
  const requestStatus = myRequest?.status;

  const withdrawButton =
    hasActiveRequest && onWithdraw ? (
      <button
        type="button"
        onClick={onWithdraw}
        className="w-full mt-2 py-2.5 text-sm font-semibold text-red-600 hover:text-red-700"
      >
        {isConfirmed ? 'Withdraw from trip' : 'Cancel request'}
      </button>
    ) : null;

  const requestStatusBanner =
    hasActiveRequest && !isConfirmed ? (
      <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 mb-3 text-center">
        <p className="text-sm font-semibold text-amber-900 capitalize">
          {requestStatus === 'waitlisted' ? 'On waitlist' : 'Request pending approval'}
        </p>
        <p className="text-xs text-amber-700/80 mt-0.5">The organizer will confirm your spot</p>
      </div>
    ) : null;

  const previewFooter = (
    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-center">
      <p className="text-sm font-semibold text-amber-900">Draft preview</p>
      <p className="text-xs text-amber-800 mt-1">This is how your activity will look once published.</p>
    </div>
  );

  const checkInFooter =
    participation && onCheckIn && onParticipationUpdated ? (
      <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200/80 p-3 shadow-lg">
        <ActivityCheckInPanel
          activityId={trip.id}
          participation={participation}
          onCheckIn={onCheckIn}
          onUpdated={onParticipationUpdated}
        />
        {withdrawButton}
      </div>
    ) : hasActiveRequest ? (
      <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200/80 p-3 shadow-lg">
        {requestStatusBanner}
        {withdrawButton}
      </div>
    ) : null;

  const joinButton =
    footerOverride ??
    (previewMode
      ? previewFooter
      : checkInFooter ?? (
          <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200/80 p-3 shadow-lg">
            <button
              type="button"
              onClick={handleJoinClick}
              disabled={hasActiveRequest}
              className={`w-full ios-btn shadow-lg disabled:opacity-60 ${
                isFull ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {joinLabel}
            </button>
          </div>
        ));

  const sidebarJoin =
    sidebarJoinOverride ??
    (previewMode ? (
      <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        Preview only — join is disabled until you publish.
      </p>
    ) : isConfirmed ? (
      participation &&
      onCheckIn &&
      onParticipationUpdated && (
        <>
          <ActivityCheckInPanel
            activityId={trip.id}
            participation={participation}
            onCheckIn={onCheckIn}
            onUpdated={onParticipationUpdated}
          />
          {withdrawButton}
        </>
      )
    ) : hasActiveRequest ? (
      <>
        {requestStatusBanner}
        {withdrawButton}
      </>
    ) : (
      <button
        type="button"
        onClick={handleJoinClick}
        disabled={!packageSelected}
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
      banner={{
        src: heroImage,
        alt: trip.title || trip.locationName,
        title: trip.title || trip.locationName,
        eyebrow: activityDetailEyebrow(trip.activityType),
        showMobileChrome: !previewMode,
        showJourney: !previewMode,
        journeyFallbackTo: backTo,
        journeyLabel: backLabel,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">About this {trip.activityType === 'event' ? 'event' : 'activity'}</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{trip.description}</p>

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
                <p className="text-sm font-semibold text-gray-900">{formatDate(trip.date)}</p>
              </div>
              {trip.endDate && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <Calendar className="w-4 h-4 text-emerald-600 mb-1" />
                  <p className="text-xs text-gray-500">End</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(trip.endDate)}</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-3">
                <Clock className="w-4 h-4 text-emerald-600 mb-1" />
                <p className="text-xs text-gray-500">Time</p>
                <p className="text-sm font-semibold text-gray-900">
                  {trip.time}
                  {trip.endTime ? ` – ${trip.endTime}` : ''}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <Users className="w-4 h-4 text-emerald-600 mb-1" />
                <p className="text-xs text-gray-500">Spots</p>
                <p className="text-sm font-semibold text-gray-900">
                  {trip.slotsAvailable}/{trip.slotsTotal} left
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Pricing</p>
                <p className={`text-sm font-semibold inline-flex px-2 py-0.5 rounded-lg ${pricingBadge.bg} ${pricingBadge.text}`}>
                  {tripPricingModeLabel(trip)}
                </p>
                {pricingMode !== 'free' && (
                  <p className="text-sm font-semibold text-gray-900 mt-1">{tripPriceLabel(trip)}</p>
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
                              name="trip-package"
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

            {(trip.startPoint || trip.meetingPoint || trip.parkingPoint || openInGoogleMapsUrl || hasAccessCoordinates) && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <Car className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-3 w-full">
                    <p className="text-sm font-semibold text-gray-900">Access details</p>
                    {(trip.startPoint || trip.meetingPoint || trip.parkingPoint) && (
                      <div className="space-y-1 text-sm text-gray-700">
                        {trip.startPoint && (
                          <p>
                            <span className="font-medium text-gray-900">Hike start point:</span> {trip.startPoint}
                          </p>
                        )}
                        {trip.meetingPoint && (
                          <p>
                            <span className="font-medium text-gray-900">Meeting point:</span> {trip.meetingPoint}
                          </p>
                        )}
                        {trip.parkingPoint && (
                          <p>
                            <span className="font-medium text-gray-900">Parking:</span> {trip.parkingPoint}
                          </p>
                        )}
                      </div>
                    )}
                    {hasAccessCoordinates && !previewMode && (
                      <MeetingPointMap
                        lat={accessLat}
                        lng={accessLng}
                        label={trip.meetingPoint ?? trip.parkingPoint ?? trip.locationName}
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

            {trip.carPoolEnabled && (
              <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <Car className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">Carpool available</p>
                    <p className="mt-1">
                      {trip.carPoolSeats != null && trip.carPoolSeats > 0
                        ? `${trip.carPoolSeats} seat${trip.carPoolSeats === 1 ? '' : 's'} · `
                        : ''}
                      {trip.carPoolFree
                        ? 'Free shared ride'
                        : trip.carPoolPriceAed != null
                          ? `AED ${trip.carPoolPriceAed} per seat`
                          : 'Shared ride'}
                    </p>
                    {trip.carPoolDetails && (
                      <p className="text-gray-600 mt-1 whitespace-pre-line">{trip.carPoolDetails}</p>
                    )}
                    {trip.linkedCarpool && (
                      <div className="mt-3 rounded-xl border border-sky-200 bg-white px-3 py-2.5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                          Linked carpool listing
                        </p>
                        <p className="mt-1 text-sm text-gray-800">
                          {trip.linkedCarpool.meetingPoint && trip.linkedCarpool.startPoint
                            ? `${trip.linkedCarpool.meetingPoint} → ${trip.linkedCarpool.startPoint}`
                            : trip.linkedCarpool.title}
                        </p>
                        <Link
                          to={`/activity/${trip.linkedCarpool.id}`}
                          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:text-sky-800"
                        >
                          View carpool details
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {trip.linkedParentActivity && (
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-gray-700">
                <p className="font-medium text-gray-900">Linked activity</p>
                <p className="mt-1">
                  This carpool is offered for{' '}
                  <Link
                    to={`/activity/${trip.linkedParentActivity.id}`}
                    className="font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    {trip.linkedParentActivity.title}
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>

          {trip.paymentTerms && pricingMode === 'shared' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Cost Shared</h2>
              <p className="text-sm text-gray-500 mb-3">
                Why this cost is shared among participants
              </p>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{trip.paymentTerms}</p>
            </div>
          )}

          {trip.paymentTerms && pricingMode === 'paid' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Payment terms</h2>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{trip.paymentTerms}</p>
            </div>
          )}

          {trip.itinerary && trip.itinerary.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Itinerary</h2>
              <ul className="space-y-2">
                {trip.itinerary.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {trip.requirements && trip.requirements.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Instructions</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                {trip.requirements.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {trip.images && trip.images.length > 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {trip.images.map((img, i) => (
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
                <p className="text-2xl font-bold text-gray-900">{tripPriceLabel(trip)}</p>
                <p className="text-sm text-gray-500">{pricePackages.length > 1 ? 'options available' : 'per person'}</p>
              </div>
              {!previewMode && (
                <div className="hidden md:block">
                  <ShareButton
                    title={trip.title || trip.locationName}
                    text={`${dateRangeLabel} · Join this ${trip.activityType} trip on UAE Trails`}
                    path={`/activity/${trip.id}`}
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
                      src={activityHostAvatar(trip)}
                      name={activityHostName(trip)}
                      className="w-11 h-11 text-sm ring-2 ring-emerald-50 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-emerald-700 truncate">
                        {activityHostName(trip)}
                      </p>
                      {showTenantBrand(trip) && trip.tenantName && (
                        <p className="text-xs text-gray-500 truncate">{trip.tenantName}</p>
                      )}
                      <p className="text-xs text-gray-500">Runs this trip · view organization</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <SecureAvatar
                      src={activityHostAvatar(trip)}
                      name={activityHostName(trip)}
                      className="w-11 h-11 text-sm ring-2 ring-emerald-50 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">{activityHostName(trip)}</p>
                      {showTenantBrand(trip) && trip.tenantName && (
                        <p className="text-xs text-gray-500 truncate">{trip.tenantName}</p>
                      )}
                    </div>
                  </div>
                )}
                {!previewMode && (
                  <HostMessageButton organizerUserId={activityHostUserId(trip)} activityId={trip.id} size="md" />
                )}
              </div>
              {trip.hostBio && <p className="mt-3 text-sm text-gray-600 leading-relaxed">{trip.hostBio}</p>}
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
                  emptyLabel="No confirmed participants yet — be the first to join!"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </MobileDetailShell>
  );
};
