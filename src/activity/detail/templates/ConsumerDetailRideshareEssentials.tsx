import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import {
  ACTIVITY_PRICING_INDICATION_NOTE,
  formatRideshareVehicleLabel,
} from '@uaetrail/shared-types';
import { MapPin } from 'lucide-react';
import { formatActivityDetailConsumerLeadDate } from '../../formatActivityDetailConsumerLead';
import {
  resolveRidesharePlanFacts,
  ridesharePlanFactsHasContent,
} from '../activityKindRequirementFacts';
import { resolveRideshareSeatsAvailability } from '../../resolveRideshareSeatsAvailability';
import { resolveRideshareContributionPresentation } from '../../resolveRideshareContributionPresentation';
import { CONSUMER_DETAIL_SECTION_TITLE } from './activityConsumerDetailSectionStyles';
import { MemberVehicleCarIcon } from '../../../components/vehicles/MemberVehicleCarIcon';
import { MEMBER_VEHICLE_COLOR_LABELS } from '../../../components/vehicles/memberVehicleColorChrome';
import { DirectionsControl } from '../../../components/ui/DirectionsControl';

/** Ride share schedule, seats, car, pickup, and payment — single block under the title on consumer detail. */
export const ConsumerDetailRideshareEssentials = ({
  activity,
  showVehiclePlate = false,
}: {
  activity: ActivityDetailDTO;
  /** Plate only for ride crew (host + confirmed participants) — see `viewerAccess.canAccessCrewSurfaces`. */
  showVehiclePlate?: boolean;
}) => {
  const facts = resolveRidesharePlanFacts(activity);
  if (!ridesharePlanFactsHasContent(facts) && !activity.date) return null;

  const leadDate = formatActivityDetailConsumerLeadDate(activity.date, activity.time);
  const scheduleLine = [leadDate.label, leadDate.time]
    .filter(Boolean)
    .join(' · ');
  const contribution = resolveRideshareContributionPresentation(activity);
  const showPricingNote = contribution.showDirectPaymentNote;
  const seatsAvailability = resolveRideshareSeatsAvailability(activity);
  const pickup = activity.meetingPoint?.trim() || null;
  const dropoff = activity.startPoint?.trim() || activity.parkingPoint?.trim() || null;
  const routeLine =
    pickup && dropoff && pickup !== dropoff ? `${pickup} → ${dropoff}` : pickup ?? dropoff;
  const vehicle = activity.rideshareVehicle ?? null;
  const pickupLat = activity.meetingLat ?? null;
  const pickupLng = activity.meetingLng ?? null;
  const hasPickupCoords = pickupLat != null && pickupLng != null;
  const dropoffLat = activity.startLat ?? null;
  const dropoffLng = activity.startLng ?? null;
  const hasSeparateDropoffCoords =
    dropoffLat != null &&
    dropoffLng != null &&
    (pickupLat == null || dropoffLat !== pickupLat || dropoffLng !== pickupLng);

  return (
    <section className="mt-3" aria-label="Ride share details">
      <p className={`mb-2 ${CONSUMER_DETAIL_SECTION_TITLE}`}>Ride share</p>
      <div className="rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50 via-white to-white p-4 shadow-[0_4px_20px_rgba(14,116,144,.08)]">
        <p className="text-base font-bold leading-snug text-neutral-950">{scheduleLine}</p>
        {seatsAvailability ? (
          <p
            className={`mt-2 inline-flex rounded-lg border px-2.5 py-1 text-sm font-semibold ${
              seatsAvailability.isFull
                ? 'border-neutral-200 bg-neutral-100 text-neutral-700'
                : 'border-sky-300 bg-sky-100 text-sky-950'
            }`}
          >
            {seatsAvailability.label}
          </p>
        ) : null}

        {pickup ? (
          <div className="mt-3 rounded-xl border border-sky-100 bg-white/90 p-3">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-800/80">Pickup</p>
                <p className="mt-0.5 text-sm font-semibold leading-snug text-neutral-900">{pickup}</p>
              </div>
            </div>
            {hasPickupCoords ? (
              <div className="mt-3">
                <DirectionsControl lat={pickupLat} lng={pickupLng} variant="compact" />
              </div>
            ) : null}
          </div>
        ) : null}

        {dropoff && pickup !== dropoff ? (
          <div className="mt-3 rounded-xl border border-sky-100 bg-white/90 p-3">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-800/80">Drop-off</p>
                <p className="mt-0.5 text-sm font-semibold leading-snug text-neutral-900">{dropoff}</p>
              </div>
            </div>
            {hasSeparateDropoffCoords && dropoffLat != null && dropoffLng != null ? (
              <div className="mt-3">
                <DirectionsControl lat={dropoffLat} lng={dropoffLng} variant="compact" />
              </div>
            ) : null}
          </div>
        ) : routeLine && !pickup ? (
          <p className="mt-2 text-sm font-medium leading-snug text-neutral-700">{routeLine}</p>
        ) : null}

        {vehicle ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-3">
            <MemberVehicleCarIcon color={vehicle.color} />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Car</p>
              <p className="text-sm font-semibold text-neutral-950">{formatRideshareVehicleLabel(vehicle)}</p>
              <p className="text-xs text-neutral-600">
                {MEMBER_VEHICLE_COLOR_LABELS[vehicle.color]}
                {showVehiclePlate && vehicle.plateNumber ? ` · Plate ${vehicle.plateNumber}` : ''}
              </p>
            </div>
          </div>
        ) : facts.vehicle ? (
          <p className="mt-2 text-sm text-neutral-700">
            <span className="font-semibold text-neutral-900">Vehicle · </span>
            {facts.vehicle}
          </p>
        ) : null}

        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          {facts.seats != null && !seatsAvailability ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Seats offered</dt>
              <dd className="mt-0.5 font-semibold text-neutral-900">{facts.seats}</dd>
            </div>
          ) : null}
          <div className="col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Seat contribution</dt>
            <dd className="mt-0.5 font-semibold leading-snug text-sky-900">{contribution.detailLabel}</dd>
          </div>
        </dl>
        {showPricingNote ? (
          <p className="mt-3 text-xs leading-relaxed text-neutral-600 border-t border-sky-100/80 pt-3">
            {ACTIVITY_PRICING_INDICATION_NOTE}
          </p>
        ) : null}
        {facts.rideshareDetails ? (
          <p className="mt-3 text-sm leading-relaxed text-neutral-700 whitespace-pre-line border-t border-sky-100/80 pt-3">
            {facts.rideshareDetails}
          </p>
        ) : null}
      </div>
    </section>
  );
};
