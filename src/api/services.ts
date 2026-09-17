import { PlaceDTO } from '@uaetrail/shared-types';
import {
  placeApi,
  exploreApi,
  rewardsApi,
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
  ...placeApi,
  ...exploreApi,
  ...rewardsApi,
  ...activitiesApi,
  ...accountApi,
  ...socialApi,
  ...organisationApi,
  ...shopApi,
  ...adminApi,
  ...chatApi,
  ...mediaApi,

  // ─── Domain API aliases (Phase 1) ───────────────────────────────────────
  // Delegate to legacy methods — same HTTP paths; see docs/DOMAIN_ADOPTION_PLAN.md.

  submitPlace(tenantId: string, payload: Partial<PlaceDTO>) {
    return this.submitHostPlace(tenantId, payload);
  },
  getOrganisationProfile(slug: string) {
    return this.getTenantProfile(slug);
  },
  /** Domain alias — public profile for a Person (`/member/:id`). */
  getPersonPublicProfile(userId: string) {
    return this.getUserPublicProfile(userId);
  },
  /** Domain alias — admin member list (`/admin/users`). */
  getAdminMembers(filters?: {
    role?: string;
    userType?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    return this.getAdminUsers(filters);
  },
  getAdminMemberDetail(id: string) {
    return this.getAdminUserDetail(id);
  },
  updateAdminMemberStatus(id: string, status: 'active' | 'suspended', comment?: string) {
    return this.updateAdminUserStatus(id, status, comment);
  },
  /** Domain alias — organisation applications (`/admin/host-applications`). */
  getAdminOrganisationApplications() {
    return this.getAdminApplications();
  },
  submitOrganisationApplication(data: Record<string, unknown>) {
    return this.submitHostApplication(data);
  },
  getMyOrganisationApplication() {
    return this.getMyHostApplication();
  },
  getMyOrganisationStatus() {
    return this.getMyHostStatus();
  },
  listOrganisationActivities(tenantId: string) {
    return this.listHostActivities(tenantId);
  },
  getOrganisationJoinRequests(tenantId: string) {
    return this.getHostRequests(tenantId);
  },
  getOrganisationTeam(tenantId: string) {
    return this.getHostTeam(tenantId);
  },
  decideOrganisationJoinRequest(
    tenantId: string,
    requestId: string,
    status: 'approved' | 'rejected',
    note?: string
  ) {
    return this.decideHostRequest(tenantId, requestId, status, note);
  },
  createOrganisationTeamMember(
    tenantId: string,
    payload: { email: string; displayName?: string; role: 'tenant_admin' | 'tenant_guide' }
  ) {
    return this.createHostTeamMember(tenantId, payload);
  },
  updateOrganisationTeamMemberRole(
    tenantId: string,
    membershipId: string,
    role: 'tenant_admin' | 'tenant_guide'
  ) {
    return this.updateHostTeamMemberRole(tenantId, membershipId, role);
  },
  toggleOrganisationTeamMemberStatus(tenantId: string, membershipId: string, isActive: boolean) {
    return this.toggleHostTeamMemberStatus(tenantId, membershipId, isActive);
  },
  removeOrganisationTeamMember(tenantId: string, membershipId: string) {
    return this.removeHostTeamMember(tenantId, membershipId);
  },
  createOrganisationActivity(tenantId: string, payload: Record<string, unknown>) {
    return this.createHostActivity(tenantId, payload);
  },
  updateOrganisationActivity(tenantId: string, activityId: string, payload: Record<string, unknown>) {
    return this.updateHostActivity(tenantId, activityId, payload);
  },
  publishOrganisationActivity(tenantId: string, activityId: string) {
    return this.publishHostActivity(tenantId, activityId);
  },
  duplicateOrganisationActivity(tenantId: string, activityId: string) {
    return this.duplicateHostActivity(tenantId, activityId);
  },
  cancelOrganisationActivity(tenantId: string, activityId: string) {
    return this.cancelHostActivity(tenantId, activityId);
  },
  updateShopOrganisationProduct(
    id: string,
    payload: Partial<{
      name: string;
      description?: string;
      images?: string[];
      priceAed: number;
      stockQuantity: number;
      lowStockThreshold: number;
      discountPercent?: number;
      packagingInfo?: string;
      category: string;
      status?: 'draft' | 'active';
    }>
  ) {
    return this.updateMerchantProduct(id, payload);
  },
  deleteShopOrganisationProduct(id: string) {
    return this.deleteMerchantProduct(id);
  },
  updateOrganisationDetails(data: OrganisationDetails) {
    return this.updateHostDetails(data);
  },
};
