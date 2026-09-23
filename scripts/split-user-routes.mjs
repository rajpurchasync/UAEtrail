import fs from 'node:fs';
import path from 'node:path';

const src = fs.readFileSync('apps/api/src/routes/user.ts', 'utf8').split(/\r?\n/);
const dir = 'apps/api/src/routes/user';
fs.mkdirSync(dir, { recursive: true });

const schemaLines = src.slice(153, 277);
const schemaHeader = [
  "import { z } from 'zod';",
  "import { UserRole } from '../../domain/enums.js';",
  "import { completeSignupProfileSchema } from '../../domain/user-profile.js';",
  "import { GROUP_WALL_REACTION_KINDS } from '../../lib/social-groups-store.js';",
  '',
].join('\n');

fs.writeFileSync(
  path.join(dir, 'schemas.ts'),
  `${schemaHeader}${schemaLines.join('\n')}

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
`
);

function wrapRegister(name, start, end, imports) {
  const body = src
    .slice(start - 1, end)
    .join('\n')
    .replace(/^userRouter\./gm, 'router.');
  const content = `${imports}
import type { Router } from 'express';

export const ${name} = (router: Router): void => {
${body}
};
`;
  fs.writeFileSync(path.join(dir, `${name}.ts`), content);
}

wrapRegister(
  'registerProfileRoutes',
  1240,
  1463,
  `import { z } from 'zod';
import { UserRole } from '../../domain/enums.js';
import { ApiError } from '../../lib/api-error.js';
import { validate } from '../../middleware/validate.js';
import { findAuthUserByEmail, findAuthUserById, updateAuthUserCore, updateAuthUserProfile } from '../../lib/auth-users.js';
import { EMAIL_VERIFICATION_OTP_TTL_MS, EMAIL_VERIFICATION_OTP_TTL_SECONDS } from '../../lib/auth-constants.js';
import { createEmailChangeToken, findEmailChangeTokenForUser, useEmailChangeToken } from '../../lib/auth-tokens.js';
import { generateEmailOtp } from '../../lib/hash.js';
import { sendVerificationEmail } from '../../lib/email.js';
import { isValidE164Phone } from '../../lib/phone.js';
import { signAccessToken } from '../../lib/jwt.js';
import { toSharedRole } from '../../lib/mappers.js';
import { assertSignupProfileAge, completeSignupProfileSchema, isSignupProfileComplete } from '../../domain/user-profile.js';
import { confirmEmailChangeSchema, requestEmailChangeSchema, roleSwitchSchema, SWITCHABLE_PRIVILEGED_ROLES, updateProfileSchema } from './schemas.js';`
);

wrapRegister(
  'registerNotificationRoutes',
  1465,
  1512,
  `import { validate } from '../../middleware/validate.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { listUserNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../../lib/notifications-store.js';
import { eventIdParamSchema } from './schemas.js';`
);

wrapRegister(
  'registerBuddyRoutes',
  1514,
  1635,
  `import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { acceptBuddyRequest, cancelBuddyRequest, createBuddyRequest, declineBuddyRequest, getBuddyRelationship, listBuddyRequestsForUser, listBuddiesForUser, unfriendBuddy } from '../../lib/buddy-store.js';
import { notifyBuddyRequestAccepted, notifyBuddyRequestReceived } from '../../services/buddy-notifications.js';
import { buddyRelationshipParamSchema, buddyRequestIdParamSchema, createBuddyRequestSchema, listBuddyRequestsQuerySchema } from './schemas.js';`
);

wrapRegister(
  'registerGroupRoutes',
  1637,
  1962,
  `import { z } from 'zod';
import { NotificationType } from '../../domain/enums.js';
import { ApiError } from '../../lib/api-error.js';
import { validate } from '../../middleware/validate.js';
import { env } from '../../config/env.js';
import { findAuthUserByEmail, findAuthUserById } from '../../lib/auth-users.js';
import { findActivityDocInMongo } from '../../lib/entity-sync.js';
import { createNotificationRecord } from '../../lib/notifications-store.js';
import { isActivityGroupChatOpen } from '../../services/activity-group-chat.js';
import { notifyGroupInvite, notifyGroupWallPost } from '../../services/social-notifications.js';
import { acceptGroupInviteByToken, createGroupInvite, createGroupWallMessage, createKidGroupMember, createSocialGroup, deleteSocialGroup, findGroupById, findGroupMemberById, getGroupMembership, listGroupInvites, listGroupMembersDetailed, listGroupsForUser, listGroupWallMessages, removeGroupMembership, setGroupMembershipActiveState, toggleGroupWallReaction, updateGroupMemberRole } from '../../lib/social-groups-store.js';
import { acceptInviteSchema, createGroupSchema, createKidSchema, createWallPostSchema, groupIdParamSchema, groupInviteSchema, groupMembershipIdParamSchema, groupMembershipPatchSchema, groupWallMessageIdParamSchema, groupWallReactionSchema } from './schemas.js';`
);

console.log('Generated user route modules');
