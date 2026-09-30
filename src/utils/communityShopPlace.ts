import type { LocationDTO } from '@uaetrail/shared-types';
import { decodeShopContributeTags } from '@uaetrail/shared-types';
import type { ShopPublicView } from '../components/shop/ShopPublicPage';

/** Map a community-submitted shop location (`activityType: shop`) to the public shop page model. */
export const communityShopPlaceToView = (place: LocationDTO): ShopPublicView | null => {
  if (place.activityType !== 'shop') return null;
  const decoded = decodeShopContributeTags(place.tags);
  if (!decoded.isCommunityShop) return null;

  const productsLine = place.highlights?.[0]?.trim() ?? '';

  return {
    id: place.id,
    reviewTargetId: null,
    shopName: place.name,
    description: place.description,
    logo: place.images?.[0] ?? null,
    websiteUrl: null,
    region: place.region ?? place.emirate ?? null,
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
    contactEmail: decoded.contactEmail,
    contactPhone: decoded.contactPhoneE164,
    contactPersonName: null,
    contactPersonAvatar: null,
    contactPersonUserId: null,
    products: productsLine
      ? [
          {
            id: `${place.id}-info`,
            name: 'What they offer',
            description: productsLine,
            images: place.images ?? [],
            priceAed: 0,
            discountPercent: null,
            externalUrl: null,
          },
        ]
      : [],
    presence: 'physical',
    communityInfo: {
      keywordTags: decoded.keywordTags,
      deliveryOffered: decoded.deliveryOffered,
      deliveryRadiusKm: decoded.deliveryRadiusKm,
      status: place.status,
    },
  };
};
