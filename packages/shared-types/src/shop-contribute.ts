/** Tags on community-submitted shop pins (`activityType: shop` locations). */

export const COMMUNITY_SHOP_TAG = 'community-shop';

const CONTACT_EMAIL_PREFIX = 'contact-email:';
const CONTACT_PHONE_PREFIX = 'contact-phone:';
const DELIVERY_KM_PREFIX = 'delivery-km:';

export type ShopContributeTagInput = {
  searchKeywords: string;
  deliveryOffered: boolean;
  deliveryRadiusKm?: number | null;
  contactEmail?: string;
  contactPhoneE164?: string;
};

export const encodeShopContributeTags = (input: ShopContributeTagInput): string[] => {
  const keywordTags = input.searchKeywords
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const tags = new Set<string>([COMMUNITY_SHOP_TAG, ...keywordTags]);

  if (input.deliveryOffered) {
    tags.add('delivery-offered');
    if (input.deliveryRadiusKm != null && input.deliveryRadiusKm > 0) {
      tags.add(`${DELIVERY_KM_PREFIX}${input.deliveryRadiusKm}`);
    }
  } else {
    tags.add('no-delivery');
  }

  const email = input.contactEmail?.trim();
  if (email) tags.add(`${CONTACT_EMAIL_PREFIX}${email}`);

  const phone = input.contactPhoneE164?.trim();
  if (phone) tags.add(`${CONTACT_PHONE_PREFIX}${phone}`);

  return [...tags];
};

export type DecodedShopContributeTags = {
  isCommunityShop: boolean;
  keywordTags: string[];
  deliveryOffered: boolean;
  deliveryRadiusKm: number | null;
  contactEmail: string | null;
  contactPhoneE164: string | null;
};

export const decodeShopContributeTags = (tags: string[] | undefined | null): DecodedShopContributeTags => {
  const list = tags ?? [];
  const isCommunityShop = list.includes(COMMUNITY_SHOP_TAG);
  const keywordTags: string[] = [];
  let deliveryOffered = false;
  let deliveryRadiusKm: number | null = null;
  let contactEmail: string | null = null;
  let contactPhoneE164: string | null = null;

  for (const tag of list) {
    if (tag === COMMUNITY_SHOP_TAG || tag === 'delivery-offered' || tag === 'no-delivery') continue;
    if (tag.startsWith(CONTACT_EMAIL_PREFIX)) {
      contactEmail = tag.slice(CONTACT_EMAIL_PREFIX.length).trim() || null;
      continue;
    }
    if (tag.startsWith(CONTACT_PHONE_PREFIX)) {
      contactPhoneE164 = tag.slice(CONTACT_PHONE_PREFIX.length).trim() || null;
      continue;
    }
    if (tag.startsWith(DELIVERY_KM_PREFIX)) {
      const km = Number(tag.slice(DELIVERY_KM_PREFIX.length));
      if (Number.isFinite(km) && km > 0) deliveryRadiusKm = km;
      continue;
    }
    keywordTags.push(tag);
  }

  if (list.includes('delivery-offered')) deliveryOffered = true;
  if (list.includes('no-delivery')) deliveryOffered = false;

  return {
    isCommunityShop,
    keywordTags,
    deliveryOffered,
    deliveryRadiusKm,
    contactEmail,
    contactPhoneE164,
  };
};
