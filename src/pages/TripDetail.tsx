import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  ChevronRight,
  CheckCircle2,
  Car
} from 'lucide-react';
import { EventDetailDTO, MyTripRequestDTO, TripParticipationDTO, WithdrawReason } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { formatDate } from '../utils';
import { formatPackagePrice, tripHasPaidPricing, tripPriceLabel } from '../utils/tripPricing';
import { showTenantBrand, tripHostAvatar, tripHostName, tripHostUserId } from '../utils/hostLabels';
import { useAuth } from '../context/AuthContext';
import { organizerProfilePath } from '../utils/organizerLinks';
import { PARTICIPANT_PRIVACY } from '../config/platform';
import { PageMeta } from '../components/seo/PageMeta';
import { JsonLd } from '../components/seo/JsonLd';
import { tripEventSchema } from '../components/seo/schemas';
import { MobileDetailShell } from '../components/mobile/MobileDetailShell';
import {
  ShareButton,
  MeetingPointMap,
  ParticipantPreview,
  OrganizerMessageButton,
  TripCheckInPanel,
  WithdrawRequestModal
} from '../components/ui';

export const TripDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<EventDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [participation, setParticipation] = useState<TripParticipationDTO | null | undefined>(undefined);
  const [myRequest, setMyRequest] = useState<MyTripRequestDTO | null | undefined>(undefined);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [selectedPackageIndex, setSelectedPackageIndex] = useState(0);

  const loadTrip = () => {
    if (!id) return;
    setLoading(true);
    setParticipation(undefined);
    setMyRequest(undefined);
    api
      .getPublicEventDetail(id)
      .then((res) => {
        setTrip(res.data);
        setParticipation(res.data.myParticipation ?? null);
        setMyRequest(res.data.myRequest ?? null);
      })
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : 'Failed to load trip details')
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTrip();
  }, [id]);

  const pricePackages = trip?.pricePackages?.filter((p) => p.label.trim()) ?? [];
  const hasMultiplePackages = pricePackages.length > 1;
  const selectedPackage = hasMultiplePackages ? pricePackages[selectedPackageIndex] : pricePackages[0];
  const isPaidTrip = trip ? tripHasPaidPricing(trip) : false;

  const requiresTerms = Boolean(trip && isPaidTrip && trip.paymentTerms);
  const canJoin =
    !requiresTerms || termsAccepted;
  const packageSelected = !hasMultiplePackages || selectedPackageIndex >= 0;
  const canSubmitJoin = canJoin && packageSelected;

  const handleJoin = async () => {
    if (!id || !trip) return;
    if (!user) {
      navigate('/signin', { state: { from: `/trip/${id}` } });
      return;
    }
    if (!canSubmitJoin) {
      setError(hasMultiplePackages && !packageSelected ? 'Please select a package option.' : 'Please accept the payment terms to continue.');
      return;
    }
    setJoining(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.createJoinRequest(
        id,
        undefined,
        hasMultiplePackages ? selectedPackageIndex : pricePackages.length === 1 ? 0 : undefined
      );
      if (res.data.waitlisted || res.data.status === 'waitlisted') {
        setMessage('Added to waitlist. We will notify you when a spot opens.');
      } else {
        setMessage('Request submitted. Track status in My Requests.');
      }
      loadTrip();
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Failed to submit request');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageMeta title="Loading trip" path={id ? `/trip/${id}` : undefined} />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
        </div>
      </>
    );
  }

  if (!trip) {
    return (
      <>
        <PageMeta title="Trip not found" noIndex path={id ? `/trip/${id}` : undefined} />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center px-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Trip Not Found</h1>
            <Link to="/trips" className="text-emerald-600 hover:text-emerald-700 font-medium">
              View all trips
            </Link>
          </div>
        </div>
      </>
    );
  }

  const heroImage =
    trip.images?.[0] ??
    trip.location.images?.[0] ??
    (trip.activityType === 'camping'
      ? 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1600'
      : 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600');

  const participants = trip.participants ?? [];
  const previewParticipants = PARTICIPANT_PRIVACY.showPreJoin ? participants : [];
  const organizerPath = organizerProfilePath(trip.tenantSlug);
  const isFull = trip.slotsAvailable <= 0;
  const locationPath =
    trip.activityType === 'hiking' ? `/trail/${trip.locationId}` : `/camp/${trip.locationId}`;

  const dateRangeLabel = trip.endDate
    ? `${formatDate(trip.date)} – ${formatDate(trip.endDate)}`
    : formatDate(trip.date);

  const joinLabel = joining ? 'Submitting…' : isFull ? 'Join Waitlist' : 'Request to Join';
  const isConfirmed = Boolean(participation);
  const hasActiveRequest = Boolean(myRequest?.canWithdraw);
  const requestStatus = myRequest?.status;

  const handleCheckIn = async (eventId: string) => api.checkInToTrip(eventId);

  const handleWithdraw = async (payload: { reason: WithdrawReason; message?: string }) => {
    if (!trip || !myRequest) return;
    setWithdrawing(true);
    setError(null);
    try {
      await api.cancelJoinRequest(trip.id, myRequest.id, payload);
      setShowWithdraw(false);
      setParticipation(null);
      setMyRequest(null);
      setMessage('You have withdrawn from this trip.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw');
      setShowWithdraw(false);
    } finally {
      setWithdrawing(false);
    }
  };

  const withdrawButton = hasActiveRequest ? (
    <button
      type="button"
      onClick={() => setShowWithdraw(true)}
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

  const checkInFooter = participation ? (
    <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200/80 p-3 shadow-lg">
      <TripCheckInPanel
        eventId={trip!.id}
        participation={participation}
        onCheckIn={handleCheckIn}
        onUpdated={setParticipation}
      />
      {withdrawButton}
    </div>
  ) : hasActiveRequest ? (
    <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200/80 p-3 shadow-lg">
      {requestStatusBanner}
      {withdrawButton}
    </div>
  ) : null;

  const termsBlock = requiresTerms && !isConfirmed ? (
    <label className="flex items-start gap-2 text-left text-sm text-gray-700 mb-3 cursor-pointer">
      <input
        type="checkbox"
        checked={termsAccepted}
        onChange={(e) => setTermsAccepted(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
      />
      <span>
        I agree to the{' '}
        <span className="font-medium text-gray-900">payment terms</span>
        {selectedPackage ? ` for ${formatPackagePrice(selectedPackage)}` : isPaidTrip ? ` (${tripPriceLabel(trip)})` : ''}.
      </span>
    </label>
  ) : null;

  const joinButton = checkInFooter ?? (
    <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200/80 p-3 shadow-lg">
      {termsBlock}
      <button
        type="button"
        onClick={handleJoin}
        disabled={joining || !canSubmitJoin || hasActiveRequest}
        className={`w-full ios-btn shadow-lg disabled:opacity-60 ${
          isFull ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
        }`}
      >
        {joinLabel}
      </button>
    </div>
  );

  const sidebarJoin = isConfirmed ? (
    participation && (
      <>
        <TripCheckInPanel
          eventId={trip.id}
          participation={participation}
          onCheckIn={handleCheckIn}
          onUpdated={setParticipation}
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
    <>
      {termsBlock}
      <button
        onClick={handleJoin}
        disabled={joining || !canSubmitJoin}
        className={`hidden md:block w-full mt-4 px-4 py-3 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-colors ${
          isFull ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
      >
        {joinLabel}
      </button>
    </>
  );

  return (
    <MobileDetailShell backTo="/trips" backLabel="Trips" footer={joinButton}>
      <PageMeta
        title={trip.title || trip.locationName}
        description={trip.description?.slice(0, 160) ?? `Join this ${trip.activityType} trip in the UAE on UAE Trail`}
        path={`/trip/${trip.id}`}
        image={heroImage}
        imageAlt={trip.title || trip.locationName}
      />
      <JsonLd data={tripEventSchema(trip)} id={`trip-${trip.id}`} />
      <div className="relative h-56 sm:h-72 md:h-80 overflow-hidden">
        <img src={heroImage} alt={trip.locationName} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute top-4 right-4">
          <ShareButton
            title={trip.title || trip.locationName}
            text={`${dateRangeLabel} · Join this ${trip.activityType} trip on UAE Trails`}
            path={`/trip/${trip.id}`}
            compact
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 max-w-6xl mx-auto">
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2 ${
              trip.activityType === 'hiking' ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white'
            }`}
          >
            {trip.activityType === 'hiking' ? 'Hiking' : 'Camping'}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{trip.title || trip.locationName}</h1>
          <p className="text-white/90 mt-1 text-sm md:text-base">
            {dateRangeLabel} · {trip.time}
            {trip.endTime ? ` – ${trip.endTime}` : ''}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">About this trip</h2>
            <p className="text-gray-600 leading-relaxed">{trip.description}</p>

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
                <p className="text-xs text-gray-500 mb-1">Price</p>
                <p className="text-sm font-semibold text-gray-900">{trip ? tripPriceLabel(trip) : ''}</p>
              </div>
            </div>

            {pricePackages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Join options</h3>
                <div className="space-y-2">
                  {pricePackages.map((pkg, index) => (
                    <label
                      key={`${pkg.label}-${index}`}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
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

            {trip.parkingPoint && (
              <div className="mt-4 flex items-start gap-2 text-sm text-gray-700">
                <Car className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Parking</p>
                  <p>{trip.parkingPoint}</p>
                  <MeetingPointMap lat={trip.parkingLat} lng={trip.parkingLng} label={trip.parkingPoint} />
                </div>
              </div>
            )}

            {trip.meetingPoint && (trip.meetingDifferent || !trip.parkingPoint) && (
              <div className="mt-4 flex items-start gap-2 text-sm text-gray-700">
                <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Meeting point</p>
                  <p>{trip.meetingPoint}</p>
                  <MeetingPointMap lat={trip.meetingLat} lng={trip.meetingLng} label={trip.meetingPoint} />
                </div>
              </div>
            )}

            {trip.carPoolEnabled && (
              <div className="mt-4 flex items-start gap-2 text-sm text-gray-700">
                <Car className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Car pool</p>
                  <p>
                    {trip.carPoolFree
                      ? 'Free shared ride'
                      : trip.carPoolPriceAed != null
                        ? `AED ${trip.carPoolPriceAed} per seat`
                        : 'Paid shared ride'}
                  </p>
                  {trip.carPoolDetails && (
                    <p className="text-gray-600 mt-1 whitespace-pre-line">{trip.carPoolDetails}</p>
                  )}
                </div>
              </div>
            )}

            {trip.location.parkingLink && !trip.parkingPoint && (
              <div className="mt-4 flex items-start gap-2 text-sm text-gray-700">
                <Car className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Parking</p>
                  <a
                    href={trip.location.parkingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:text-emerald-800 font-medium"
                  >
                    View parking on map →
                  </a>
                </div>
              </div>
            )}

            <Link
              to={locationPath}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              View location details
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {trip.paymentTerms && isPaidTrip && (
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
              <div className="hidden md:block">
                <ShareButton
                  title={trip.title || trip.locationName}
                  text={`${dateRangeLabel} · Join this ${trip.activityType} trip on UAE Trails`}
                  path={`/trip/${trip.id}`}
                />
              </div>
            </div>

            {sidebarJoin}

            {message && <p className="mt-3 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">{message}</p>}
            {error && <p className="mt-3 text-sm text-amber-800 bg-amber-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Host</p>
              <div className="flex items-center gap-2">
                {organizerPath ? (
                  <Link to={organizerPath} className="flex items-center gap-3 group flex-1 min-w-0">
                    {tripHostAvatar(trip) ? (
                      <img
                        src={tripHostAvatar(trip)}
                        alt={tripHostName(trip)}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-50"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                        {tripHostName(trip).charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-emerald-700 truncate">
                        {tripHostName(trip)}
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
                    {tripHostAvatar(trip) ? (
                      <img
                        src={tripHostAvatar(trip)}
                        alt={tripHostName(trip)}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-50"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                        {tripHostName(trip).charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">{tripHostName(trip)}</p>
                      {showTenantBrand(trip) && trip.tenantName && (
                        <p className="text-xs text-gray-500 truncate">{trip.tenantName}</p>
                      )}
                    </div>
                  </div>
                )}
                <OrganizerMessageButton
                  organizerUserId={tripHostUserId(trip)}
                  signInReturnTo={`/trip/${trip.id}`}
                  size="md"
                />
              </div>
              {trip.hostBio && (
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{trip.hostBio}</p>
              )}
            </div>

            {PARTICIPANT_PRIVACY.showPreJoin && (
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
      <WithdrawRequestModal
        open={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        tripTitle={trip.title || trip.locationName}
        tripDate={trip.date}
        variant={isConfirmed ? 'trip' : 'request'}
        submitting={withdrawing}
        onConfirm={handleWithdraw}
      />
    </MobileDetailShell>
  );
};
