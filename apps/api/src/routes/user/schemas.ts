import { FACILITY_KINDS } from '@uaetrail/shared-types';
import { z } from 'zod';
import { UserRole } from '../../domain/enums.js';
import { personNameSchema } from '../../domain/person-name.js';
import { completeSignupProfileSchema, profileLanguagesSchema, USER_CITIES } from '../../domain/user-profile.js';
import { GROUP_WALL_REACTION_KINDS } from '../../domain/group-wall-reactions.js';
export const eventIdParamSchema = z.object({ id: z.string().min(1) });
export const requestIdParamSchema = z.object({ id: z.string().min(1), requestId: z.string().min(1) });

export const createRequestSchema = z.object({
  note: z.string().max(1000).optional(),
  packingCheckedIds: z.array(z.string().min(1).max(80)).max(40).optional(),
  packingSignature: z.string().max(80).optional(),
  adults: z.coerce.number().int().min(1).max(20).optional(),
  kids: z.coerce.number().int().min(0).max(20).optional(),
});

export const rsvpSchema = createRequestSchema;

const mediaUrlSchema = z.string().min(1).refine(
  (value) => value.startsWith('/') || /^https?:\/\//i.test(value),
  { message: 'Invalid media URL' }
);

export const updateProfileSchema = z
  .object({
  givenName: personNameSchema.optional(),
  surname: personNameSchema.optional(),
  phone: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.string().max(30).optional()
  ),
  bio: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.string().max(400).optional()
  ),
  avatarUrl: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    mediaUrlSchema.optional()
  ),
  profileVisibility: z.enum(['public', 'group_members', 'private']).optional(),
  dateOfBirth: completeSignupProfileSchema.shape.dateOfBirth.optional(),
  gender: completeSignupProfileSchema.shape.gender.optional(),
  city: z.enum(USER_CITIES).optional(),
  countryCode: completeSignupProfileSchema.shape.countryCode.optional(),
  languages: profileLanguagesSchema.optional(),
})
  .refine(
    (body) =>
      (body.givenName === undefined && body.surname === undefined) ||
      (body.givenName !== undefined && body.surname !== undefined),
    { message: 'Provide both name and surname.' }
  );

export const requestEmailChangeSchema = z.object({
  newEmail: z.string().email()
});

export const confirmEmailChangeSchema = z.object({
  newEmail: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit verification code.')
});

export const roleSwitchSchema = z.object({
  target: z.enum(['participant', 'original'])
});

export const createGroupSchema = z.object({
  type: z.enum(['family', 'friends']),
  name: z.string().min(2).max(80),
  slogan: z.string().max(120).optional(),
  bannerUrl: mediaUrlSchema.optional(),
  photoUrl: mediaUrlSchema.optional()
});

export const groupIdParamSchema = z.object({ groupId: z.string().min(1) });
export const groupMembershipIdParamSchema = z.object({ groupId: z.string().min(1), membershipId: z.string().min(1) });
export const groupWallMessageIdParamSchema = z.object({ groupId: z.string().min(1), messageId: z.string().min(1) });

export const groupInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['buddy', 'admin']).default('buddy')
});

export const acceptInviteSchema = z.object({
  token: z.string().min(20)
});

export const createKidSchema = z.object({
  displayName: z.string().min(2).max(80),
  role: z.enum(['buddy', 'admin']).optional()
});

export const groupMembershipPatchSchema = z
  .object({
    isActive: z.boolean().optional(),
    role: z.enum(['buddy', 'admin']).optional()
  })
  .refine((body) => body.isActive !== undefined || body.role !== undefined, {
    message: 'Provide isActive and/or role.'
  });

export const groupWallReactionSchema = z.object({
  kind: z.enum(GROUP_WALL_REACTION_KINDS)
});

export const buddyRequestIdParamSchema = z.object({ requestId: z.string().min(1) });
export const buddyRelationshipParamSchema = z.object({ userId: z.string().min(1) });
export const createBuddyRequestSchema = z.object({
  targetUserId: z.string().min(1),
  message: z.string().max(300).optional(),
});
export const listBuddyRequestsQuerySchema = z.object({
  direction: z.enum(['incoming', 'outgoing', 'all']).optional(),
});

export const createWallPostSchema = z.object({
  body: z.string().min(1).max(600),
  replyToMessageId: z.string().min(1).optional(),
});

export const groupWallListQuerySchema = z
  .object({
    since: z.string().datetime().optional(),
    /** Load messages older than this timestamp (ascending batch). */
    before: z.string().datetime().optional(),
    /** Load messages older than this message id (stable cursor; preferred over `before`). */
    beforeMessageId: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .refine(
    (query) => {
      const modes = [query.since, query.before, query.beforeMessageId].filter(Boolean).length;
      return modes <= 1;
    },
    { message: 'Use only one of since, before, or beforeMessageId' }
  );

export const groupSettingsPatchSchema = z
  .object({
    wallPostPolicy: z.enum(['all_members', 'admins_only']).optional(),
    photoUrl: z.union([mediaUrlSchema, z.literal(''), z.null()]).optional(),
  })
  .refine((body) => body.wallPostPolicy !== undefined || body.photoUrl !== undefined, {
    message: 'Provide wallPostPolicy and/or photoUrl.',
  });

export const SWITCHABLE_PRIVILEGED_ROLES: UserRole[] = [
  UserRole.PLATFORM_ADMIN,
  UserRole.MERCHANT_ADMIN,
  UserRole.TENANT_OWNER,
  UserRole.TENANT_ADMIN,
  UserRole.TENANT_GUIDE
];

export const listFilterSchema = z.object({
  activityType: z.enum(['hiking', 'camping', 'event']).optional(),
  featured: z.coerce.boolean().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().min(1).max(500).default(50).optional(),
  countryCode: z.string().length(2).optional(),
  q: z.string().max(120).optional(),
  country: z.string().max(80).optional(),
  area: z.string().max(80).optional(),
  venue: z.string().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20).optional()
});

/** Venue picker registry — published places plus caller-specific drafts/admin rows. */
export const placeRegistryQuerySchema = listFilterSchema.pick({
  activityType: true,
  countryCode: true,
});

export const placeCatalogQuerySchema = placeRegistryQuerySchema.extend({
  segment: z.enum(['place', 'all']).optional(),
  areaId: z.string().min(1).max(80).optional(),
  purpose: z.enum(['organize_picker', 'map', 'admin_queue', 'detail']).optional(),
});

export const facilityCatalogQuerySchema = z.object({
  areaId: z.string().min(1).max(80).optional(),
  parentPlaceId: z.string().min(1).max(80).optional(),
  facilityKind: z.enum(FACILITY_KINDS as unknown as [string, ...string[]]).optional(),
  countryCode: z.string().length(2).optional(),
  purpose: z.enum(['organize_picker', 'map', 'admin_queue', 'detail']).optional(),
});

export const facilitiesListQuerySchema = z.object({
  countryCode: z.string().length(2).optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

export const userBriefParamSchema = z.object({ userId: z.string().min(1) });

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const userSearchSchema = z.object({
  q: z.string().min(1).max(100),
});

export const hostDetailsSchema = z.object({
  experience: z.string().max(50).optional(),
  languages: z.string().max(300).optional(),
  certificates: z.string().max(1000).optional(),
  notableHikes: z.string().max(1000).optional(),
  nationality: z.string().max(80).optional(),
  residence: z.string().max(80).optional(),
});
