import type { ActivityDetailDTO, ActivityDTO, LocationDTO, AuthUser } from '@uaetrail/shared-types';
import type { ActivityFormState } from '../components/activities/activityFormState';
import { buildHostActivityPayload, buildRequirementsFromForm } from '../components/activities/activityFormState';
import { derivePriceAed } from './tripPricing';

const fallbackLocation = (locationId: string, name: string): LocationDTO => ({
  id: locationId,
  name,
  region: '',
  activityType: 'hiking',
  description: '',
  season: [],
  childFriendly: false,
  images: [],
  featured: false,
  status: 'active',
  countryCode: 'AE',
});

/** Build an ActivityDetailDTO for host preview from saved form + API activity. */
export const buildActivityDetailPreview = (
  form: ActivityFormState,
  saved: ActivityDTO,
  venue: LocationDTO | undefined,
  user: AuthUser | null,
  tenantName?: string
): ActivityDetailDTO => {
  const payload = buildHostActivityPayload(form);
  const pricePackages =
    (payload.pricePackages as ActivityDTO['pricePackages']) ??
    (saved.pricePackages?.length ? saved.pricePackages : []);

  const price =
    typeof payload.price === 'number'
      ? payload.price
      : derivePriceAed(pricePackages ?? [], saved.price);

  const venueName = venue?.name ?? saved.locationName ?? 'Venue';

  return {
    ...saved,
    id: saved.id,
    tenantId: saved.tenantId ?? form.tenantId,
    locationId: form.locationId || saved.locationId,
    title: form.title.trim() || saved.title,
    description: form.description.trim() || saved.description,
    date: form.date || saved.date,
    time: form.time || saved.time,
    activityType: 'hiking',
    status: saved.status ?? 'draft',
    slotsTotal: form.capacity || saved.slotsTotal || 0,
    slotsAvailable: form.capacity || saved.slotsAvailable || 0,
    price: price ?? 0,
    pricePackages: pricePackages ?? [],
    pricingMode: (payload.pricingMode as ActivityDTO['pricingMode']) ?? saved.pricingMode ?? null,
    paymentTerms: (payload.paymentTerms as string | undefined) ?? saved.paymentTerms ?? null,
    startPoint: (payload.startPoint as string | undefined) ?? saved.startPoint ?? null,
    startLat: (payload.startLat as number | null | undefined) ?? saved.startLat ?? null,
    startLng: (payload.startLng as number | null | undefined) ?? saved.startLng ?? null,
    meetingPoint: (payload.meetingPoint as string | undefined) ?? saved.meetingPoint ?? null,
    meetingLat: (payload.meetingLat as number | null | undefined) ?? saved.meetingLat ?? null,
    meetingLng: (payload.meetingLng as number | null | undefined) ?? saved.meetingLng ?? null,
    parkingPoint: (payload.parkingPoint as string | undefined) ?? saved.parkingPoint ?? null,
    parkingLat: (payload.parkingLat as number | null | undefined) ?? saved.parkingLat ?? null,
    parkingLng: (payload.parkingLng as number | null | undefined) ?? saved.parkingLng ?? null,
    meetingDifferent: Boolean(payload.meetingDifferent),
    carPoolEnabled: Boolean(payload.carPoolEnabled),
    carPoolFree: (payload.carPoolFree as boolean | null | undefined) ?? saved.carPoolFree ?? null,
    carPoolPriceAed: (payload.carPoolPriceAed as number | null | undefined) ?? saved.carPoolPriceAed ?? null,
    carPoolSeats: (payload.carPoolSeats as number | null | undefined) ?? saved.carPoolSeats ?? null,
    carPoolDetails: (payload.carPoolDetails as string | undefined) ?? saved.carPoolDetails ?? null,
    requirements: buildRequirementsFromForm(form),
    images: form.images.length > 0 ? form.images : saved.images ?? [],
    locationName: venueName,
    hostName: saved.hostName ?? user?.displayName ?? user?.email ?? 'Host',
    hostUserId: saved.hostUserId ?? form.hostUserId ?? user?.id,
    hostAvatar: saved.hostAvatar ?? user?.avatarUrl ?? undefined,
    tenantName: tenantName ?? saved.tenantName,
    hostId: form.hostUserId || saved.hostId,
    participants: [],
    location: venue ?? fallbackLocation(form.locationId || saved.locationId, venueName),
    myParticipation: null,
    myRequest: null,
  };
};
