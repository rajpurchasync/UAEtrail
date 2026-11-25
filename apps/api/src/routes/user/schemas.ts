import {
  FACILITY_KINDS,
  PROFILE_FIELD_PRIVACY_KEYS,
  SOCIAL_GROUP_NAME_MAX_LENGTH,
  SOCIAL_GROUP_NAME_MIN_LENGTH,
} from '@uaetrail/shared-types';
import { z } from 'zod';
import { UserRole } from '../../domain/enums.js';
import { personNameSchema } from '../../domain/person-name.js';
import { guideExperienceSchema } from '../../domain/guide-profile.js';
import { completeSignupProfileSchema, profileLanguagesSchema, USER_CITIES } from '../../domain/user-profile.js';
import { GROUP_WALL_REACTION_KINDS } from '../../domain/group-wall-reactions.js';
export const eventIdParamSchema = z.object({ id: z.string().min(1) });
export const requestIdParamSchema = z.object({ id: z.string().min(1), requestId: z.string().min(1) });

export const createRequestSchema = z
  .object({
    note: z.string().max(1000).optional(),
    packingCheckedIds: z.array(z.string().min(1).max(80)).max(40).optional(),
    packingSignature: z.string().max(80).optional(),
    adults: z.coerce.number().int().min(1).max(20).optional(),
    kids: z.coerce.number().int().min(0).max(20).optional(),
    partyMemberIds: z.array(z.string().min(1)).max(20).optional(),
    sourceTeamId: z.string().min(1).optional(),
  })
  .refine(
    (body) => !(body.partyMemberIds?.length && (body.adults !== undefined || body.kids !== undefined)),
    { message: 'Send either partyMemberIds or adults/kids headcount — not both.' }
  );

export const rsvpSchema = createRequestSchema;

export const updateRequestPartySchema = z
  .object({
    note: z.string().max(500).optional(),
    adults: z.coerce.number().int().min(1).max(20).optional(),
    kids: z.coerce.number().int().min(0).max(20).optional(),
    partyMemberIds: z.array(z.string().min(1)).max(20).optional(),
    sourceTeamId: z.string().min(1).optional(),
  })
  .refine(
    (body) =>
      body.note !== undefined ||
      body.adults !== undefined ||
      body.kids !== undefined ||
      body.partyMemberIds !== undefined ||
      body.sourceTeamId !== undefined,
    { message: 'At least one field is required.' }
  )
  .refine(
    (body) => !(body.partyMemberIds?.length && (body.adults !== undefined || body.kids !== undefined)),
    { message: 'Send either partyMemberIds or adults/kids headcount — not both.' }
  );

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
  guideExperience: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    guideExperienceSchema.optional()
  ),
})
  .refine(
    (body) =>
      (body.givenName === undefined && body.surname === undefined) ||
      (body.givenName !== undefined && body.surname !== undefined),
    { message: 'Provide both name and surname.' }
  );

const profileFieldAudienceSchema = z.enum([
  'hidden',
  'friends',
  'friends_of_friends',
  'public',
]);

const profileDateOfBirthShareSchema = z.enum([
  'hidden',
  'month_day_friends',
  'month_day_friends_of_friends',
  'month_day_public',
  'full_friends',
  'full_friends_of_friends',
  'full_public',
]);

const profileFriendsListShareSchema = z.enum([
  'only_me',
  'friends_crew',
  'friends_of_friends',
  'mutual_only',
]);

const findCrewVisibilitySchema = z.enum(['friends', 'friends_of_friends', 'none']);

export const updateProfileFieldPrivacySchema = z
  .object({
    fieldPrivacy: z
      .object(
        Object.fromEntries(
          PROFILE_FIELD_PRIVACY_KEYS.map((key) => [key, profileFieldAudienceSchema.optional()])
        ) as Record<(typeof PROFILE_FIELD_PRIVACY_KEYS)[number], z.ZodOptional<typeof profileFieldAudienceSchema>>
      )
      .strict()
      .optional(),
    dateOfBirthShare: profileDateOfBirthShareSchema.optional(),
    friendsListShare: profileFriendsListShareSchema.optional(),
    findCrewVisibility: findCrewVisibilitySchema.optional(),
  })
  .refine(
    (body) =>
      body.fieldPrivacy !== undefined ||
      body.dateOfBirthShare !== undefined ||
      body.friendsListShare !== undefined ||
      body.findCrewVisibility !== undefined,
    {
      message:
        'Provide fieldPrivacy, dateOfBirthShare, friendsListShare, and/or findCrewVisibility.',
    }
  );

const notificationChannelSchema = z
  .object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    inApp: z.boolean().optional(),
  })
  .strict();

export const updateNotificationPreferencesSchema = z
  .object({
    topics: z
      .object({
        plans: notificationChannelSchema.optional(),
        social: notificationChannelSchema.optional(),
        account: notificationChannelSchema.optional(),
        map_alerts: notificationChannelSchema.optional(),
      })
      .strict()
      .optional(),
    dnd: z
      .object({
        mode: z.enum(['off', 'always', 'schedule']).optional(),
        fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
        toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

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

const teamLabelSchema = z.enum(['family', 'friends', 'colleagues']);

export const createGroupSchema = z
  .object({
    teamLabel: teamLabelSchema.optional(),
    /** @deprecated Send `teamLabel` — kept for older clients. */
    type: teamLabelSchema.optional(),
    name: z.string().min(SOCIAL_GROUP_NAME_MIN_LENGTH).max(SOCIAL_GROUP_NAME_MAX_LENGTH),
    slogan: z.string().max(120).optional(),
    bannerUrl: mediaUrlSchema.optional(),
    photoUrl: mediaUrlSchema.optional(),
  })
  .superRefine((body, ctx) => {
    if (!body.teamLabel && !body.type) {
      ctx.addIssue({
        code: 'custom',
        message: 'teamLabel is required.',
        path: ['teamLabel'],
      });
    }
  })
  .transform((body) => ({
    teamLabel: body.teamLabel ?? body.type!,
    name: body.name,
    slogan: body.slogan,
    bannerUrl: body.bannerUrl,
    photoUrl: body.photoUrl,
  }));

export const groupIdParamSchema = z.object({ groupId: z.string().min(1) });
export const groupMembershipIdParamSchema = z.object({ groupId: z.string().min(1), membershipId: z.string().min(1) });
export const groupWallMessageIdParamSchema = z.object({ groupId: z.string().min(1), messageId: z.string().min(1) });

export const groupInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['member', 'admin']).default('member')
});

export const acceptInviteSchema = z.object({
  token: z.string().min(20)
});

export {
  createKidBodySchema,
  createKidSchema,
  patchKidSchema,
  type CreateKidBodyInput,
} from '../../domain/family-kid-profile.js';

export const groupMembershipPatchSchema = z
  .object({
    isActive: z.boolean().optional(),
    role: z.enum(['member', 'admin']).optional()
  })
  .refine((body) => body.isActive !== undefined || body.role !== undefined, {
    message: 'Provide isActive and/or role.'
  });

export const groupWallReactionSchema = z.object({
  kind: z.enum(GROUP_WALL_REACTION_KINDS)
});

export const friendRequestIdParamSchema = z.object({ requestId: z.string().min(1) });
export const friendRelationshipParamSchema = z.object({ userId: z.string().min(1) });
export const createFriendRequestSchema = z.object({
  targetUserId: z.string().min(1),
  message: z.string().max(300).optional(),
});
export const listFriendRequestsQuerySchema = z.object({
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
    name: z.string().min(SOCIAL_GROUP_NAME_MIN_LENGTH).max(SOCIAL_GROUP_NAME_MAX_LENGTH).optional(),
  })
  .refine(
    (body) =>
      body.wallPostPolicy !== undefined || body.photoUrl !== undefined || body.name !== undefined,
    {
      message: 'Provide wallPostPolicy, photoUrl, and/or name.',
    }
  );

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
  destinationId: z.string().min(1).max(80).optional(),
  onSiteId: z.string().min(1).max(80).optional(),
  /** @deprecated inbound alias — use `destinationId`. */
  areaId: z.string().min(1).max(80).optional(),
  /** @deprecated inbound alias — use `onSiteId`. */
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
