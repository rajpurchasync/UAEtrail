import type { HostProfileType, ShopPresence } from '@uaetrail/shared-types';
import { DEFAULT_PHONE_DIAL, PHONE_COUNTRIES } from '../../constants/phoneCountries';
import type { HostApplication } from '../../api/services';
import { formatE164Phone } from '../../utils/phone';

export type BecomeHostFormState = {
  hostProfileType: HostProfileType | null;
  hostDisplayName: string;
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
  shopPresence: ShopPresence | null;
  latitude: number | null;
  longitude: number | null;
  region: string;
};

export const emptyBecomeHostForm = (): BecomeHostFormState => ({
  hostProfileType: null,
  hostDisplayName: '',
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
  shopPresence: null,
  latitude: null,
  longitude: null,
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

export const buildBecomeHostFormPrefill = (input: {
  displayName?: string | null;
  bio?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  application?: HostApplication | null;
}): BecomeHostFormState => {
  const base = emptyBecomeHostForm();
  const meta = input.application?.metadata;
  const metaRecord = meta as Record<string, unknown> | undefined;
  const storedPhone = splitStoredPhone(input.phone ?? meta?.phoneE164 ?? meta?.phone);
  const profileType = resolveProfileType(meta, input.application?.requestedType);

  return {
    ...base,
    hostProfileType: profileType,
    hostDisplayName: meta?.hostDisplayName ?? input.displayName ?? '',
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
    shopPresence:
      metaRecord?.shopPresence === 'physical' || metaRecord?.shopPresence === 'online'
        ? (metaRecord.shopPresence as ShopPresence)
        : typeof meta?.latitude === 'number' && typeof meta?.longitude === 'number'
          ? 'physical'
          : meta?.website
            ? 'online'
            : null,
    latitude: typeof meta?.latitude === 'number' ? meta.latitude : null,
    longitude: typeof meta?.longitude === 'number' ? meta.longitude : null,
    region: meta?.region ?? '',
  };
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
      bio,
      profilePhoto: form.profilePhoto || '',
      phoneCountryCode: form.phoneCountryCode,
      phone,
      nationality: form.nationality,
      residence: form.residence,
      languages: form.languages.trim(),
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
    ...(form.region.trim() ? { region: form.region.trim() } : {}),
  };

  if (form.hostProfileType === 'agency') {
    return {
      ...base,
      services: form.services.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
    };
  }

  const shopPresence = form.shopPresence ?? 'online';
  if (shopPresence === 'online') {
    return {
      ...base,
      shopPresence: 'online',
      latitude: null,
      longitude: null,
    };
  }

  return {
    ...base,
    shopPresence: 'physical',
    latitude: form.latitude,
    longitude: form.longitude,
  };
};

export const formatHostPhonePreview = (dial: string, national: string): string =>
  formatE164Phone(dial, national) || 'your full international number';
