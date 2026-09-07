import type { HostProfileType } from '@uaetrail/shared-types';
import { MAP_CONFIG } from '../../config/platform';
import { DEFAULT_PHONE_DIAL, PHONE_COUNTRIES } from '../../constants/phoneCountries';
import type { HostApplication } from '../../api/services';
import { formatE164Phone, isValidNationalPhone } from '../../utils/phone';

export type BecomeHostFormState = {
  hostProfileType: HostProfileType | null;
  hostDisplayName: string;
  dateOfBirth: string;
  bio: string;
  profilePhoto: string;
  phoneCountryCode: string;
  phone: string;
  nationality: string;
  residence: string;
  languages: string;
  interests: string;
  requestedName: string;
  website: string;
  services: string;
  latitude: number;
  longitude: number;
  region: string;
};

export const emptyBecomeHostForm = (): BecomeHostFormState => ({
  hostProfileType: null,
  hostDisplayName: '',
  dateOfBirth: '',
  bio: '',
  profilePhoto: '',
  phoneCountryCode: DEFAULT_PHONE_DIAL,
  phone: '',
  nationality: '',
  residence: '',
  languages: '',
  interests: '',
  requestedName: '',
  website: '',
  services: '',
  latitude: MAP_CONFIG.defaultCenter.lat,
  longitude: MAP_CONFIG.defaultCenter.lng,
  region: '',
});

const splitStoredPhone = (value?: string | null): { dial: string; national: string } => {
  if (!value?.trim()) return { dial: DEFAULT_PHONE_DIAL, national: '' };
  const trimmed = value.trim();
  const match = [...PHONE_COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((country) => trimmed.startsWith(country.dial));
  if (match) {
    return { dial: match.dial, national: trimmed.slice(match.dial.length).trim() };
  }
  return { dial: DEFAULT_PHONE_DIAL, national: trimmed.replace(/^\+/, '') };
};

const resolveProfileType = (
  meta?: HostApplication['metadata'],
  requestedType?: string
): HostProfileType | null => {
  const fromMeta = meta?.hostProfileType;
  if (fromMeta === 'individual' || fromMeta === 'agency' || fromMeta === 'shop') {
    return fromMeta;
  }
  if (requestedType?.toLowerCase() === 'company') {
    return meta?.services ? 'agency' : 'shop';
  }
  return null;
};

export const maxDateOfBirthForHost = (): string => {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 15);
  return cutoff.toISOString().slice(0, 10);
};

export const isAtLeastHostAge = (dateOfBirth: string, minYears = 15): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return false;
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return false;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - minYears);
  return dob <= cutoff;
};

export const buildBecomeHostFormPrefill = (input: {
  displayName?: string | null;
  bio?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  application?: HostApplication | null;
}): BecomeHostFormState => {
  const base = emptyBecomeHostForm();
  const meta = input.application?.metadata;
  const storedPhone = splitStoredPhone(input.phone ?? meta?.phoneE164 ?? meta?.phone);
  const profileType = resolveProfileType(meta, input.application?.requestedType);

  return {
    ...base,
    hostProfileType: profileType,
    hostDisplayName: meta?.hostDisplayName ?? input.displayName ?? '',
    dateOfBirth: meta?.dateOfBirth ?? '',
    bio: meta?.bio ?? input.bio ?? '',
    profilePhoto: meta?.profilePhoto ?? input.avatarUrl ?? '',
    phoneCountryCode: meta?.phoneCountryCode ?? storedPhone.dial,
    phone: meta?.phone ?? storedPhone.national,
    nationality: meta?.nationality ?? '',
    residence: meta?.residence ?? meta?.region ?? '',
    languages: meta?.languages ?? '',
    interests: meta?.interests ?? '',
    requestedName: meta?.requestedName ?? input.application?.requestedName ?? '',
    website: meta?.website ?? '',
    services: meta?.services ?? '',
    latitude: typeof meta?.latitude === 'number' ? meta.latitude : base.latitude,
    longitude: typeof meta?.longitude === 'number' ? meta.longitude : base.longitude,
    region: meta?.region ?? '',
  };
};

export const validateBecomeHostForm = (form: BecomeHostFormState): string | null => {
  if (!form.hostProfileType) return 'Choose how you want to host.';

  if (!isValidNationalPhone(form.phone)) {
    return 'Enter a valid mobile number.';
  }

  if (form.bio.trim().length < 20) {
    return 'About section must be at least 20 characters.';
  }

  if (form.hostProfileType === 'individual') {
    if (!form.hostDisplayName.trim()) return 'Name is required.';
    if (!form.dateOfBirth) return 'Date of birth is required.';
    if (!isAtLeastHostAge(form.dateOfBirth)) return 'You must be at least 15 years old.';
    if (!form.nationality) return 'Nationality is required.';
    if (!form.residence) return 'Based in (UAE) is required.';
    if (!form.languages.trim()) return 'Languages are required.';
    if (!form.interests.trim()) return 'Interests are required.';
    return null;
  }

  if (!form.requestedName.trim()) {
    return form.hostProfileType === 'agency' ? 'Agency name is required.' : 'Shop name is required.';
  }
  if (!form.profilePhoto.trim()) {
    return form.hostProfileType === 'agency' ? 'Agency image is required.' : 'Shop image is required.';
  }
  if (form.hostProfileType === 'agency' && !form.services.trim()) {
    return 'Services are required.';
  }
  if (form.latitude == null || form.longitude == null) {
    return 'Pin your location on the map.';
  }

  return null;
};

export const buildHostApplicationPayload = (
  form: BecomeHostFormState
): Record<string, unknown> | null => {
  if (!form.hostProfileType) return null;

  const phone = form.phone.trim();
  const bio = form.bio.trim();

  if (form.hostProfileType === 'individual') {
    return {
      hostProfileType: 'individual',
      hostDisplayName: form.hostDisplayName.trim(),
      dateOfBirth: form.dateOfBirth,
      bio,
      profilePhoto: form.profilePhoto || '',
      phoneCountryCode: form.phoneCountryCode,
      phone,
      nationality: form.nationality,
      residence: form.residence,
      languages: form.languages.trim(),
      interests: form.interests.trim(),
    };
  }

  const base = {
    hostProfileType: form.hostProfileType,
    requestedName: form.requestedName.trim(),
    bio,
    phoneCountryCode: form.phoneCountryCode,
    phone,
    website: form.website.trim(),
    profilePhoto: form.profilePhoto,
    latitude: form.latitude,
    longitude: form.longitude,
    ...(form.region.trim() ? { region: form.region.trim() } : {}),
  };

  if (form.hostProfileType === 'agency') {
    return { ...base, services: form.services.trim() };
  }

  return base;
};

export const formatHostPhonePreview = (dial: string, national: string): string =>
  formatE164Phone(dial, national) || 'your full international number';
