import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const servicesPath = path.join(root, 'src/api/services.ts');
const src = fs.readFileSync(servicesPath, 'utf8');

const typesStart = src.indexOf('export interface HostApplication');
const apiStart = src.indexOf('export const api = {');
const aliasStart = src.indexOf('  // ─── Domain API aliases (Phase 1)');

if (typesStart < 0 || apiStart < 0 || aliasStart < 0) {
  throw new Error('Could not locate split markers in services.ts');
}

const typesBlock = src.slice(typesStart, apiStart).trim();
const typesHeader = `import { ActivityDTO, ActivityDetailDTO, TenantListDTO, TenantType } from '@uaetrail/shared-types';\n\n`;
fs.writeFileSync(path.join(root, 'src/api/types.ts'), `${typesHeader}${typesBlock}\n`);

const aliasBlock = src.slice(aliasStart).trimEnd();
const aliasEnd = aliasBlock.lastIndexOf('};');
const aliasesOnly = aliasBlock.slice(0, aliasEnd).trim();

const domains = {
  activities: {
    imports: `import { ActivityDTO, JoinRequestDTO, MyActivityDTO, ParticipantDTO, WithdrawReason } from '@uaetrail/shared-types';\nimport { apiRequest, getStoredSession } from '../client';\nimport type { ActivityDetail, ActivityRequestView } from '../types';\n\n`,
    methods: [
      'getPublicActivities',
      'getFeaturedActivities',
      'getPublicActivityDetail',
      'getActivityGroupChat',
      'createJoinRequest',
      'cancelJoinRequest',
      'updateJoinRequestNote',
      'getMeRequests',
      'getMeRequest',
      'getMeActivities',
      'getAdminActivities',
      'getAdminActivityDetail',
      'moderateActivity',
      'toggleActivityFeatured',
      'listHostActivities',
      'createHostActivity',
      'updateHostActivity',
      'publishHostActivity',
      'fulfillParticipantIntent',
      'duplicateHostActivity',
      'cancelHostActivity',
      'getActivityParticipants',
      'checkinParticipant',
      'undoCheckin',
      'getActivityHistory',
    ],
  },
  account: {
    imports: `import { NotificationDTO } from '@uaetrail/shared-types';\nimport { apiRequest, downloadAuthenticatedFile } from '../client';\nimport type {\n  AccountDeletionInfo,\n  ContentReportReason,\n  ContentReportTargetType,\n  PublicMemberProfileDTO,\n  TenantMembershipView,\n  UserProfile,\n} from '../types';\n\n`,
    methods: [
      'getMeProfile',
      'getUserPublicProfile',
      'updateMeProfile',
      'completeSignupProfile',
      'requestEmailChange',
      'confirmEmailChange',
      'getAccountDeletionInfo',
      'deleteAccount',
      'downloadMyDataExport',
      'changePassword',
      'requestChangePasswordOtp',
      'switchMeRole',
      'getMeNotifications',
      'markNotificationRead',
      'markAllNotificationsRead',
      'getVapidPublicKey',
      'savePushSubscription',
      'removePushSubscription',
      'getMyTenants',
      'searchUsers',
      'getUserBrief',
    ],
  },
  social: {
    imports: `import {\n  BuddyRelationshipDTO,\n  BuddyRequestDTO,\n  BuddySummaryDTO,\n  FavoriteDTO,\n  PostDTO,\n  PostReplyDTO,\n  ReviewDTO,\n} from '@uaetrail/shared-types';\nimport { apiRequest, getStoredSession } from '../client';\nimport type {\n  ContentReportReason,\n  ContentReportTargetType,\n  SocialGroupInviteView,\n  SocialGroupMemberView,\n  SocialGroupView,\n  SocialGroupWallMessageView,\n  SocialGroupWallReactionView,\n} from '../types';\n\n`,
    methods: [
      'reportContent',
      'getMeBuddies',
      'getMeBuddyRequests',
      'getBuddyRelationship',
      'sendBuddyRequest',
      'acceptBuddyRequest',
      'declineBuddyRequest',
      'cancelBuddyRequest',
      'unfriendBuddy',
      'getMeGroups',
      'createMeGroup',
      'deleteMeGroup',
      'getMeGroupDetail',
      'createMeGroupInvite',
      'acceptMeGroupInvite',
      'createMeGroupKid',
      'updateMeGroupMemberStatus',
      'updateMeGroupMemberRole',
      'removeMeGroupMember',
      'getMeGroupWall',
      'createMeGroupWallPost',
      'toggleMeGroupWallReaction',
      'getReviews',
      'createReview',
      'getPosts',
      'getPost',
      'createPost',
      'replyToPost',
      'togglePostLike',
      'toggleReplyLike',
      'acceptPostReply',
      'getMeFavorites',
      'checkFavorite',
      'addFavorite',
      'removeFavorite',
    ],
  },
  organisation: {
    imports: `import { ActivityDTO } from '@uaetrail/shared-types';\nimport { apiRequest } from '../client';\nimport type {\n  ActivityRequestView,\n  HostApplication,\n  HostDetails,\n  TeamMember,\n  TenantProfile,\n} from '../types';\n\n`,
    methods: [
      'getTenantProfile',
      'getHostRequests',
      'decideHostRequest',
      'getHostTeam',
      'createHostTeamMember',
      'updateHostTeamMemberRole',
      'toggleHostTeamMemberStatus',
      'removeHostTeamMember',
      'submitHostApplication',
      'getMyHostApplication',
      'getMyHostStatus',
      'updateHostDetails',
    ],
  },
  shop: {
    imports: `import {\n  MerchantAnalyticsInterval,\n  MerchantAnalyticsSeriesDTO,\n  MerchantOrderLineItemDTO,\n  MerchantProfileDTO,\n  MerchantPublicDTO,\n  OrderStatus,\n  ProductDTO,\n  ShopPublicDTO,\n} from '@uaetrail/shared-types';\nimport { apiRequest, downloadAuthenticatedFile } from '../client';\n\n`,
    methods: [
      'getCheckoutConfig',
      'createCheckoutSession',
      'getShopProducts',
      'getShopProductDetail',
      'getMerchantProfile',
      'getShopOrganisationStores',
      'getMerchantStores',
      'getShopOrganisationProfile',
      'getMerchantProfileById',
      'createShopOrganisationProfile',
      'createMerchantProfile',
      'updateShopOrganisationProfile',
      'updateMerchantProfile',
      'getShopOrganisationProducts',
      'getMerchantProducts',
      'addShopOrganisationProduct',
      'addMerchantProduct',
      'updateMerchantProduct',
      'deleteMerchantProduct',
      'getMerchantAnalytics',
      'downloadMerchantAnalyticsReport',
      'getMerchantOrders',
      'updateMerchantOrderStatus',
      'getMerchantPublic',
      'getShopPublic',
    ],
  },
  admin: {
    imports: `import { ActivityDTO, ProductDTO, TenantListDTO, UserListDTO } from '@uaetrail/shared-types';\nimport { apiRequest } from '../client';\nimport type {\n  AdminMetrics,\n  AdminSocialGroupDetail,\n  AdminSocialGroupListItem,\n  AuditLogEntry,\n  HostApplication,\n  TenantDetail,\n} from '../types';\n\n`,
    methods: [
      'getAdminMetrics',
      'getAdminApplications',
      'reviewAdminApplication',
      'getAdminUsers',
      'getAdminUserDetail',
      'updateAdminUserStatus',
      'getAdminGroups',
      'getAdminGroupDetail',
      'updateAdminGroupStatus',
      'getAdminTenants',
      'getAdminTenantDetail',
      'updateAdminTenantStatus',
      'getAdminAuditLogs',
      'sendAdminNotification',
      'getAdminNotifications',
      'getAdminProducts',
      'updateAdminProductStatus',
    ],
  },
  chat: {
    imports: `import { ChatConversationDTO, ChatMessageDTO } from '@uaetrail/shared-types';\nimport { apiRequest } from '../client';\n\n`,
    methods: ['getConversations', 'createChatStreamTicket', 'getMessages', 'sendMessage'],
  },
  media: {
    imports: `import { apiRequest } from '../client';\n\n`,
    methods: ['presignUpload', 'commitUpload', 'resolveMedia'],
  },
};

function extractMethod(source, name) {
  const key = `${name}:`;
  const start = source.indexOf(`  ${key}`);
  if (start < 0) throw new Error(`Missing method ${name}`);
  let i = start + key.length;
  while (i < source.length && source[i] !== '(' && source[i] !== ':') i++;
  if (source[i] === ':') {
    // function property
    i = source.indexOf('(', i);
  }
  let depth = 0;
  let inString = null;
  for (; i < source.length; i++) {
    const ch = source[i];
    const prev = source[i - 1];
    if (inString) {
      if (ch === inString && prev !== '\\') inString = null;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      inString = ch;
      continue;
    }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth === 0 && ch === ',') {
      const tail = source.slice(i + 1, i + 60);
      if (/^\s*\n\s*(\/\/|\/\*|[a-zA-Z_])/.test(tail)) {
        return source.slice(start, i).trimEnd();
      }
    }
  }
  return source.slice(start).trimEnd().replace(/,\s*$/, '');
}

const apiBody = src.slice(apiStart + 'export const api = {'.length, aliasStart);

for (const [file, cfg] of Object.entries(domains)) {
  const chunks = cfg.methods.map((name) => extractMethod(apiBody, name));
  const body = chunks.join(',\n\n  ');
  const content = `${cfg.imports}export const ${file}Api = {\n  ${body}\n} as const;\n`;
  fs.writeFileSync(path.join(root, `src/api/domains/${file}.ts`), content);
  console.log('wrote', file, cfg.methods.length, 'methods');
}

const indexExports = [
  "export { placeApi } from './places';",
  "export { exploreApi } from './explore';",
  ...Object.keys(domains).map((k) => `export { ${k}Api } from './${k}';`),
].join('\n');
fs.writeFileSync(path.join(root, 'src/api/domains/index.ts'), `${indexExports}\n`);

const spreadLines = [
  '  ...placeApi,',
  '  ...exploreApi,',
  ...Object.keys(domains).map((k) => `  ...${k}Api,`),
].join('\n');

const servicesOut = `import { PlaceDTO } from '@uaetrail/shared-types';
import {
  placeApi,
  exploreApi,
  activitiesApi,
  accountApi,
  socialApi,
  organisationApi,
  shopApi,
  adminApi,
  chatApi,
  mediaApi,
} from './domains';
import type { OrganisationDetails } from './types';

export * from './types';

export const api = {
${spreadLines}

  ${aliasesOnly}
};
`;

fs.writeFileSync(servicesPath, servicesOut);
console.log('rewrote services.ts');
