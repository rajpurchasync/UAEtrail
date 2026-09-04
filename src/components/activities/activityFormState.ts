import type { ActivityDTO } from '@uaetrail/shared-types';
import type { ActivityType } from '../../config/activityTypes';
import { derivePriceAed, inferTripPricingMode, type TripPricePackage } from '../../utils/tripPricing';
import { parseCoord } from '../ui/MeetingPointMap';

export type PricingMode = 'free' | 'shared' | 'paid';
export type CarPoolPricing = 'free' | 'shared';

export type LocationPinForm = {
  label: string;
  mapsUrl: string;
  lat: string;
  lng: string;
};

export type CampingSurfaceType = '' | 'sand' | 'grass';

export type ActivityFormState = {
  activityType: ActivityType;
  tenantId: string;
  locationId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  capacity: number;
  pricingMode: PricingMode;
  sharedAmount: number;
  sharedCostInfo: string;
  price: number;
  pricePackages: TripPricePackage[];
  paymentTerms: string;
  start: LocationPinForm;
  parking: LocationPinForm;
  meeting: LocationPinForm;
  whatToBringItems: string[];
  mandatoryInstructions: string;
  fitnessLevel: string;
  campingSurfaceType: CampingSurfaceType;
  noChildren: boolean;
  noPets: boolean;
  additionalRequirements: string;
  fourByFourOnly: boolean;
  carPoolEnabled: boolean;
  carPoolPricing: CarPoolPricing;
  carPoolSharedAmount: number;
  carPoolSeats: number;
  carPoolDetails: string;
  images: string[];
  signupUrl: string;
  eventEmirate: string;
  eventState: string;
  eventVenueDetail: string;
  eventHostOrganization: string;
  hostUserId: string;
};

const emptyPin = (): LocationPinForm => ({ label: '', mapsUrl: '', lat: '', lng: '' });

export const emptyActivityForm = (activityType: ActivityType = 'hiking'): ActivityFormState => ({
  activityType,
  tenantId: '',
  locationId: '',
  title: '',
  description: '',
  date: '',
  time: '09:00',
  capacity: 10,
  pricingMode: 'free',
  sharedAmount: 0,
  sharedCostInfo: '',
  price: 0,
  pricePackages: [],
  paymentTerms: '',
  start: emptyPin(),
  parking: emptyPin(),
  meeting: emptyPin(),
  whatToBringItems: [''],
  mandatoryInstructions: '',
  fitnessLevel: '',
  campingSurfaceType: '',
  noChildren: false,
  noPets: false,
  additionalRequirements: '',
  fourByFourOnly: false,
  carPoolEnabled: false,
  carPoolPricing: 'free',
  carPoolSharedAmount: 0,
  carPoolSeats: 0,
  carPoolDetails: '',
  images: [],
  signupUrl: '',
  eventEmirate: '',
  eventState: '',
  eventVenueDetail: '',
  eventHostOrganization: '',
  hostUserId: '',
});

const pinFromEvent = (
  label: string | null | undefined,
  lat: number | null | undefined,
  lng: number | null | undefined
): LocationPinForm => ({
  label: label ?? '',
  mapsUrl: '',
  lat: lat != null ? String(lat) : '',
  lng: lng != null ? String(lng) : '',
});

const parseRequirementsToForm = (requirements: string[]) => {
  const whatToBringItems: string[] = [];
  const instructionLines: string[] = [];
  const recommendationLines: string[] = [];
  let fitnessLevel = '';
  let campingSurfaceType: CampingSurfaceType = '';
  let fourByFourOnly = false;
  let noChildren = false;
  let noPets = false;
  let eventHostOrganization = '';

  for (const item of requirements) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('What to bring: ')) {
      whatToBringItems.push(trimmed.slice('What to bring: '.length));
    } else if (trimmed.startsWith('Instructions: ')) {
      instructionLines.push(trimmed.slice('Instructions: '.length));
    } else if (trimmed.startsWith('Instruction: ')) {
      instructionLines.push(trimmed.slice('Instruction: '.length));
    } else if (trimmed.startsWith('Recommendation: ')) {
      recommendationLines.push(trimmed.slice('Recommendation: '.length));
    } else if (trimmed.startsWith('Fitness level: ')) {
      fitnessLevel = trimmed.slice('Fitness level: '.length);
    } else if (trimmed.startsWith('Camping surface: ')) {
      const surface = trimmed.slice('Camping surface: '.length).toLowerCase();
      if (surface === 'sand' || surface === 'grass') campingSurfaceType = surface;
    } else if (trimmed.startsWith('Host organization: ')) {
      eventHostOrganization = trimmed.slice('Host organization: '.length);
    } else if (trimmed === 'Reachable by 4x4 only') {
      fourByFourOnly = true;
    } else if (trimmed === 'No children') {
      noChildren = true;
    } else if (trimmed === 'No pets') {
      noPets = true;
    } else if (!trimmed.startsWith('Policy: ')) {
      recommendationLines.push(trimmed);
    }
  }

  return {
    whatToBringItems: whatToBringItems.length > 0 ? whatToBringItems : [''],
    mandatoryInstructions: instructionLines.join('\n'),
    fitnessLevel,
    campingSurfaceType,
    fourByFourOnly,
    noChildren,
    noPets,
    additionalRequirements: recommendationLines.join('\n'),
    eventHostOrganization,
  };
};

const inferPricingMode = (activity: ActivityDTO): PricingMode =>
  inferTripPricingMode({
    price: activity.price,
    pricePackages: activity.pricePackages,
    paymentTerms: activity.paymentTerms,
    pricingMode: activity.pricingMode,
  });

export const activityToForm = (activity: ActivityDTO): ActivityFormState => {
  const pricePackages =
    activity.pricePackages && activity.pricePackages.length > 0
      ? activity.pricePackages
      : activity.price > 0
        ? [{ label: 'Standard', amount: activity.price, currency: 'AED' as const }]
        : [];

  const pricingMode = inferPricingMode(activity);
  const instructionFields = parseRequirementsToForm(activity.requirements ?? []);

  return {
    activityType: (activity.activityType as ActivityType) ?? 'hiking',
    tenantId: activity.tenantId ?? '',
    locationId: activity.locationId,
    title: activity.title ?? '',
    description: activity.description ?? '',
    date: activity.date,
    time: activity.time,
    capacity: activity.slotsTotal,
    pricingMode,
    sharedAmount: pricingMode === 'shared' ? activity.price : 0,
    sharedCostInfo: pricingMode === 'shared' ? activity.paymentTerms ?? '' : '',
    price: activity.price,
    pricePackages,
    paymentTerms: pricingMode === 'paid' ? activity.paymentTerms ?? '' : '',
    start: pinFromEvent(activity.startPoint, activity.startLat, activity.startLng),
    parking: pinFromEvent(activity.parkingPoint, activity.parkingLat, activity.parkingLng),
    meeting: pinFromEvent(activity.meetingPoint, activity.meetingLat, activity.meetingLng),
    ...instructionFields,
    carPoolEnabled: activity.carPoolEnabled ?? false,
    carPoolPricing: activity.carPoolEnabled && activity.carPoolFree === false ? 'shared' : 'free',
    carPoolSharedAmount: activity.carPoolPriceAed ?? 0,
    carPoolSeats: activity.carPoolSeats ?? 0,
    carPoolDetails: activity.carPoolDetails ?? '',
    images: activity.images?.slice(0, 1) ?? [],
    signupUrl: activity.signupUrl ?? '',
    eventEmirate: '',
    eventState: activity.region ?? '',
    eventVenueDetail: '',
    eventHostOrganization: instructionFields.eventHostOrganization ?? '',
    hostUserId: activity.hostId ?? activity.hostUserId ?? '',
  };
};

export const buildRequirementsFromForm = (form: ActivityFormState): string[] => {
  const lines: string[] = [];
  for (const item of form.whatToBringItems) {
    const trimmed = item.trim();
    if (trimmed) lines.push(`What to bring: ${trimmed}`);
  }
  if (form.mandatoryInstructions.trim()) {
    lines.push(`Instructions: ${form.mandatoryInstructions.trim()}`);
  }
  if (form.fitnessLevel.trim()) lines.push(`Fitness level: ${form.fitnessLevel.trim()}`);
  if (form.campingSurfaceType) {
    const label = form.campingSurfaceType === 'sand' ? 'Sand' : 'Grass';
    lines.push(`Camping surface: ${label}`);
  }
  if (form.activityType === 'community_activity' && form.eventHostOrganization.trim()) {
    lines.push(`Host organization: ${form.eventHostOrganization.trim()}`);
  }
  if (form.fourByFourOnly) lines.push('Reachable by 4x4 only');
  if (form.noChildren) lines.push('No children');
  if (form.noPets) lines.push('No pets');
  if (form.additionalRequirements.trim()) {
    lines.push(`Recommendation: ${form.additionalRequirements.trim()}`);
  }
  return lines;
};

const resolvePinText = (pin: LocationPinForm): string | undefined => {
  const label = pin.label.trim();
  const url = pin.mapsUrl.trim();
  if (label && url) return `${label} — ${url}`;
  return label || url || undefined;
};

export const buildHostActivityPayload = (form: ActivityFormState): Record<string, unknown> => {
  let price = 0;
  let pricePackages: TripPricePackage[] = [];
  let paymentTerms: string | undefined;

  if (form.pricingMode === 'shared') {
    price = Math.max(0, form.sharedAmount);
    paymentTerms = form.sharedCostInfo.trim() || undefined;
  } else if (form.pricingMode === 'paid') {
    pricePackages =
      form.pricePackages.filter((p) => p.label.trim()).length > 0
        ? form.pricePackages.filter((p) => p.label.trim()).map((p) => ({ ...p, label: p.label.trim() }))
        : form.price > 0
          ? [{ label: 'Standard', amount: form.price, currency: 'AED' as const }]
          : [];
    price = derivePriceAed(pricePackages, form.price);
    paymentTerms = form.paymentTerms.trim() || undefined;
  }

  return {
    activityType: form.activityType,
    locationId: form.locationId,
    title: form.title.trim(),
    description: form.description.trim(),
    date: form.date,
    time: form.time,
    capacity: form.capacity,
    price,
    pricePackages,
    paymentTerms,
    startPoint: resolvePinText(form.start),
    startLat: parseCoord(form.start.lat),
    startLng: parseCoord(form.start.lng),
    meetingPoint: resolvePinText(form.meeting),
    meetingLat: parseCoord(form.meeting.lat),
    meetingLng: parseCoord(form.meeting.lng),
    parkingPoint: resolvePinText(form.parking),
    parkingLat: parseCoord(form.parking.lat),
    parkingLng: parseCoord(form.parking.lng),
    meetingDifferent: Boolean(
      resolvePinText(form.meeting) &&
        resolvePinText(form.start) &&
        resolvePinText(form.meeting) !== resolvePinText(form.start)
    ),
    carPoolEnabled: form.carPoolEnabled,
    carPoolFree: form.carPoolEnabled ? form.carPoolPricing === 'free' : null,
    carPoolPriceAed:
      form.carPoolEnabled && form.carPoolPricing === 'shared' ? form.carPoolSharedAmount : null,
    carPoolSeats: form.carPoolEnabled ? form.carPoolSeats : null,
    carPoolDetails:
      form.carPoolEnabled && form.carPoolDetails.trim() ? form.carPoolDetails.trim() : undefined,
    requirements: buildRequirementsFromForm(form),
    images: form.images.slice(0, 1),
    bannerUrl: null,
    signupUrl: form.signupUrl.trim() || null,
    hostId: form.hostUserId || undefined,
    pricingMode: form.pricingMode,
  };
};

export const FORM_INPUT =
  'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

export const FORM_LABEL = 'block text-sm font-medium text-gray-700 mb-1';

export const FORM_TEXTAREA =
  'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[120px]';