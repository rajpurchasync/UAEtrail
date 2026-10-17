import { createHostApplicationRecord } from '../lib/host-applications-store.js';
import {
  acceptGroupInviteByToken,
  acceptPendingGroupInvitesForEmail,
} from '../lib/social-groups-store.js';
import { slugify } from '../lib/slug.js';

export const createHostApplicationOnSignup = async (input: {
  applicantId: string;
  accountType: 'company' | 'guide';
  displayName: string;
  organizationName?: string;
}) => {
  const requestedName = input.organizationName ?? `${input.displayName} Adventures`;
  await createHostApplicationRecord({
    applicantId: input.applicantId,
    requestedName,
    requestedSlug: slugify(input.organizationName ?? `${input.displayName}-adventures`),
    requestedType: input.accountType === 'company' ? 'COMPANY' : 'GUIDE_OWNED',
  });
};

export const acceptGroupInvitesForNewUser = (input: {
  userId: string;
  email: string;
  groupInviteToken?: string;
}) => {
  if (input.groupInviteToken) {
    return acceptGroupInviteByToken({
      token: input.groupInviteToken,
      userId: input.userId,
      email: input.email,
    });
  }
  return acceptPendingGroupInvitesForEmail({ userId: input.userId, email: input.email });
};
