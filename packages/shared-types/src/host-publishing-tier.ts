/**
 * How a tenant (organisation row) participates in publishing — orthogonal to `UserRole`.
 *
 * | Tier          | Tenant signal                    | Who                          |
 * |---------------|----------------------------------|------------------------------|
 * | community     | `publishingPurpose: community`   | Individual buddy host        |
 * | professional  | `publishingPurpose: professional`| Pro guide (Pro Membership)   |
 * | business      | `publishingPurpose: business`    | Agency, shop, company tenant |
 *
 * A member may hold multiple tenants; team staff link via `tenant_memberships` (business tier).
 */
export type HostPublishingTier = 'community' | 'professional' | 'business';

export type HostTierFlags = {
  /** Profile complete + community publish tenant (free / shared Host). */
  community: boolean;
  /** Approved professional guide tenant — free + shared-cost Host (not paid). */
  professional: boolean;
  /** Owner or active team member on agency / shop / company tenant. */
  business: boolean;
};

/** Server-resolved profile subtitle (member / host / guide / agency / shop owner). */
export type MemberProfileRoleLabel =
  | 'community_member'
  | 'host'
  | 'professional_guide'
  | 'agency'
  | 'shop_owner'
  | 'platform_staff';
