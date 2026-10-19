import { z } from 'zod';
import { TenantType } from './enums.js';
import { formatE164Phone, isValidE164Phone, isValidNationalPhone } from '../lib/phone.js';

const mediaPathSchema = z
  .string()
  .min(1)
  .refine((value) => value.startsWith('/') || /^https?:\/\//i.test(value), {
    message: 'Invalid image URL'
  });

const optionalHttpUrlSchema = z
  .string()
  .max(500)
  .optional()
  .or(z.literal(''))
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  })
  .refine(
    (value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid http(s) URL' }
  );

const phoneFields = {
  phoneCountryCode: z.string().regex(/^\+\d{1,4}$/),
  phone: z.string().min(4).max(20)
};

const validatePhone = (body: { phoneCountryCode: string; phone: string }, ctx: z.RefinementCtx) => {
  if (!isValidNationalPhone(body.phone)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid mobile number.', path: ['phone'] });
  }
  const e164 = formatE164Phone(body.phoneCountryCode, body.phone);
  if (!isValidE164Phone(e164)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Enter a valid mobile number with country code.',
      path: ['phone']
    });
  }
};

const mapPinFields = {
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  region: z.string().min(2).max(80).optional()
};

const _hostProfileTypeSchema = z.enum(['individual', 'agency', 'shop']);

export type HostProfileType = z.infer<typeof _hostProfileTypeSchema>;

const individualApplicationSchema = z.object({
  hostProfileType: z.literal('individual'),
  hostDisplayName: z.string().min(2).max(80),
  bio: z.string().min(20).max(2000),
  profilePhoto: mediaPathSchema,
  ...phoneFields,
  nationality: z.string().min(2).max(80),
  residence: z.string().min(2).max(80),
  languages: z.string().min(1).max(300),
});

const agencyApplicationSchema = z.object({
  hostProfileType: z.literal('agency'),
  requestedName: z.string().min(2).max(120),
  bio: z.string().min(20).max(2000),
  ...phoneFields,
  website: optionalHttpUrlSchema,
  profilePhoto: mediaPathSchema,
  services: z.string().min(2).max(2000),
  ...mapPinFields
});

const shopApplicationSchema = z.object({
  hostProfileType: z.literal('shop'),
  requestedName: z.string().min(2).max(120),
  bio: z.string().min(20).max(2000),
  ...phoneFields,
  website: optionalHttpUrlSchema,
  profilePhoto: mediaPathSchema,
  shopPresence: z.enum(['physical', 'online']),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  region: z.string().min(2).max(80).optional(),
  searchKeywords: z.string().min(2).max(500).optional(),
  deliveryOffered: z.boolean().optional(),
  deliveryRadiusKm: z.number().positive().max(1000).optional(),
  contactEmail: z
    .string()
    .email()
    .max(120)
    .optional()
    .or(z.literal(''))
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
});

export const hostApplicationBodySchema = z
  .discriminatedUnion('hostProfileType', [
    individualApplicationSchema,
    agencyApplicationSchema,
    shopApplicationSchema
  ])
  .superRefine((body, ctx) => {
    validatePhone(body, ctx);
    if (body.hostProfileType !== 'shop') return;
    if (body.shopPresence === 'online' && !body.website) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Online shops need a website URL.',
        path: ['website']
      });
    }
    if (body.shopPresence === 'physical' && (body.latitude == null || body.longitude == null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pin your shop on the map.',
        path: ['latitude']
      });
    }
    if (body.deliveryOffered === true && body.deliveryRadiusKm == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Choose a delivery distance.',
        path: ['deliveryRadiusKm']
      });
    }
  });

export type HostApplicationBody = z.infer<typeof hostApplicationBodySchema>;

export const resolveHostApplicationTenantType = (profileType: HostProfileType): TenantType =>
  profileType === 'individual' ? TenantType.GUIDE_OWNED : TenantType.COMPANY;

export const buildHostApplicationMetadata = (
  body: HostApplicationBody,
  phoneE164: string
): Record<string, unknown> => {
  const base = {
    hostProfileType: body.hostProfileType,
    bio: body.bio,
    phoneCountryCode: body.phoneCountryCode,
    phone: body.phone,
    phoneE164
  };

  if (body.hostProfileType === 'individual') {
    return {
      ...base,
      hostDisplayName: body.hostDisplayName,
      nationality: body.nationality,
      residence: body.residence,
      languages: body.languages,
      profilePhoto: body.profilePhoto,
    };
  }

  if (body.hostProfileType === 'shop') {
    return {
      ...base,
      requestedName: body.requestedName,
      website: body.website ?? '',
      profilePhoto: body.profilePhoto,
      shopPresence: body.shopPresence,
      latitude: body.shopPresence === 'online' ? null : body.latitude ?? null,
      longitude: body.shopPresence === 'online' ? null : body.longitude ?? null,
      region: body.region ?? null,
      searchKeywords: body.searchKeywords ?? '',
      deliveryOffered: body.deliveryOffered ?? false,
      deliveryRadiusKm: body.deliveryRadiusKm ?? null,
      contactEmail: body.contactEmail ?? '',
    };
  }

  return {
    ...base,
    requestedName: body.requestedName,
    website: body.website ?? '',
    profilePhoto: body.profilePhoto,
    latitude: body.latitude,
    longitude: body.longitude,
    region: body.region ?? null,
    services: body.services,
  };
};

export const resolveHostApplicationRequestedName = (body: HostApplicationBody): string =>
  body.hostProfileType === 'individual' ? body.hostDisplayName.trim() : body.requestedName.trim();

export const resolveHostApplicationDisplayName = (body: HostApplicationBody): string =>
  body.hostProfileType === 'individual' ? body.hostDisplayName.trim() : body.requestedName.trim();
