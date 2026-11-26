import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { ReviewDTO } from '@uaetrail/shared-types';
import { PageMeta } from '../seo/PageMeta';
import {
  ConsumerDetailSectionJumpNav,
  DetailPageShell,
  HeroBanner,
  RatingStatTile,
  SectionCard,
  StatGrid,
  StatTile,
} from '../../detail/shell';
import {
  parseShopPublicDetailTabParam,
  SHOP_PUBLIC_TAB_QUERY,
  type ShopPublicDetailTabId,
} from '../../shop/shopPublicDetailTab';
import { ShopContactSection } from './ShopContactSection';
import { ShareButton, DirectionsControl } from '../ui';
import { ReviewSection } from '../ui/ReviewSection';
import { DetailReviewFooter, scrollToReviewAnchor } from '../ui/DetailReviewChrome';
import { detailBackPath } from '../../config/routingCatalog';
import { shopPublicPath } from '../../utils/shopPaths';
import { fetchOrganisationReviews } from '../../hooks/organisationConsoleApi';
import { CONSUMER_DETAIL_OVERVIEW_LABEL } from '../../content/consumerDetailSectionLabels';
import { keyFactIconFromLabel } from '../../detail/shell/keyFactIcons';
import { useAuth } from '../../context/AuthContext';
import {
  ADD_PLACE_PENDING_BANNER_BODY,
  ADD_PLACE_PENDING_BANNER_TITLE,
} from '@/discovery/discoveryPortExploreCreateFlowCopy';
import { EXPLORE_PEEK_CTA } from '../../config/exploreTheme';

export type ShopPublicView = {
  id: string;
  /** Tenant id — community reviews are keyed on tenant, not merchant id. */
  reviewTargetId?: string | null;
  shopName: string;
  description?: string | null;
  logo?: string | null;
  websiteUrl?: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactPersonName?: string | null;
  contactPersonAvatar?: string | null;
  contactPersonUserId?: string | null;
  allowInboundChat?: boolean;
  presence: 'physical' | 'online';
  /** Community map contribution — not a merchant tenant. */
  communityInfo?: {
    keywordTags: string[];
    deliveryOffered: boolean;
    deliveryRadiusKm: number | null;
    status?: 'draft' | 'active' | 'inactive';
  };
};

interface ShopPublicPageProps {
  shop: ShopPublicView;
}

const SHOP_TAB_SCROLL_ANCHORS: Record<ShopPublicDetailTabId, string> = {
  about: 'shop-detail-about',
  location: 'shop-detail-location',
};

const averageRating = (reviews: ReviewDTO[]): number | null => {
  if (reviews.length === 0) return null;
  return reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length;
};

/** Unified public gear-shop page — scroll-first §5 layout. */
export const ShopPublicPage = ({ shop }: ShopPublicPageProps) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const inboundTab = parseShopPublicDetailTabParam(searchParams.get(SHOP_PUBLIC_TAB_QUERY));

  const publicPath = shopPublicPath({ merchantId: shop.id });
  const mapBack = detailBackPath('shop');
  const website = shop.websiteUrl?.trim() || null;
  const reviewTargetId = shop.reviewTargetId?.trim() || null;
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const hasCoords = shop.latitude != null && shop.longitude != null;

  const shopKindLabel = shop.communityInfo
    ? 'Community shop'
    : shop.presence === 'online'
      ? 'Online partner'
      : 'Gear shop';

  const presenceLabel =
    shop.presence === 'online'
      ? shop.region
        ? `${shop.region} · Online`
        : 'Online · UAE'
      : shop.region ?? 'Physical store';

  useEffect(() => {
    if (!reviewTargetId) {
      setReviews([]);
      return;
    }
    fetchOrganisationReviews(reviewTargetId)
      .then((data) => setReviews(data))
      .catch(() => setReviews([]));
  }, [reviewTargetId]);

  useEffect(() => {
    if (!reviewTargetId) return;
    const hash = window.location.hash;
    if (hash === '#reviews' || hash.startsWith('#review-')) {
      requestAnimationFrame(() => scrollToReviewAnchor(hash));
    }
  }, [reviewTargetId, reviews.length]);

  useEffect(() => {
    const anchor = SHOP_TAB_SCROLL_ANCHORS[inboundTab];
    if (!anchor || inboundTab === 'about') return;
    const el = document.getElementById(anchor);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [inboundTab, shop.id]);

  const userReview = useMemo(
    () => (user ? reviews.find((review) => review.userId === user.id) : undefined),
    [reviews, user]
  );

  const reviewFooter = reviewTargetId ? <DetailReviewFooter userReview={userReview} accent="amber" /> : undefined;
  const avgRating = averageRating(reviews);

  const jumpLinks = useMemo(
    () => [
      {
        href: '#shop-detail-about',
        label: CONSUMER_DETAIL_OVERVIEW_LABEL,
        sectionId: 'shop-detail-about',
      },
      { href: '#shop-detail-location', label: 'Location', sectionId: 'shop-detail-location' },
      ...(reviewTargetId
        ? [{ href: '#shop-detail-reviews', label: 'Reviews', sectionId: 'shop-detail-reviews' }]
        : []),
    ],
    [reviewTargetId]
  );

  const websiteCta = website ? (
    <a
      href={website}
      target="_blank"
      rel="noopener noreferrer"
      className={`${EXPLORE_PEEK_CTA.primary} lg:!rounded-lg lg:!py-2 lg:!text-[13px]`}
    >
      Visit shop website
      <ExternalLink className="h-4 w-4 ms-1.5 inline" aria-hidden />
    </a>
  ) : null;

  const directionsCta =
    hasCoords && !website ? (
      <DirectionsControl
        lat={shop.latitude as number}
        lng={shop.longitude as number}
        variant="button"
        label="Get directions"
        showAppPickerAffordance={false}
        buttonClassName={`${EXPLORE_PEEK_CTA.primary} lg:!rounded-lg lg:!py-2 lg:!text-[13px]`}
      />
    ) : null;

  const primaryAction = websiteCta ?? directionsCta ?? undefined;

  const mobileFooter =
    reviewTargetId && reviewFooter ? (
      <div className="space-y-2">
        {primaryAction}
        {reviewFooter}
      </div>
    ) : (
      primaryAction
    );

  const aside =
    primaryAction || shop.contactPhone ? (
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Get in touch</p>
        {primaryAction}
        {shop.contactPhone ? (
          <a
            href={`tel:${shop.contactPhone}`}
            className="flex w-full items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-semibold text-neutral-900"
          >
            Call {shop.contactPhone}
          </a>
        ) : null}
      </div>
    ) : undefined;

  return (
    <>
      <PageMeta
        title={shop.shopName}
        description={shop.description?.slice(0, 160) ?? `${shop.shopName} on UAE Trail`}
        path={publicPath}
        image={shop.logo ?? undefined}
        imageAlt={shop.shopName}
      />

      <DetailPageShell
        backTo={mapBack}
        backLabel="Explore"
        headerChrome={{ emoji: '🛍️', label: shopKindLabel }}
        headerAction={
          <ShareButton
            title={shop.shopName}
            text={shop.description?.slice(0, 120) ?? `${shop.shopName} on UAE Trail`}
            path={publicPath}
            iconOnly
            light
          />
        }
        footer={mobileFooter}
        footerClassName={mobileFooter ? 'md:hidden' : undefined}
        aside={aside}
        jumpRow={<ConsumerDetailSectionJumpNav links={jumpLinks} />}
        hero={
          <HeroBanner
            imageUrl={shop.logo}
            typeBadge={
              <span className="rounded-full border border-white/35 bg-white/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                {shopKindLabel}
              </span>
            }
            title={shop.shopName}
            subtitle={
              <p className="flex items-center gap-1.5 text-sm text-white/90">
                {shop.region ? (
                  <>
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                    {presenceLabel}
                  </>
                ) : shop.presence === 'online' ? (
                  'Online partner · ships to UAE'
                ) : null}
              </p>
            }
          />
        }
        aboveJumpRow={
          shop.communityInfo?.status === 'draft' ? (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="font-semibold">{ADD_PLACE_PENDING_BANNER_TITLE}</p>
              <p className="mt-1 text-amber-900/90">{ADD_PLACE_PENDING_BANNER_BODY}</p>
            </div>
          ) : null
        }
        keyFacts={
          <StatGrid label="Key facts">
            {presenceLabel ? (
              <StatTile
                label="Location"
                value={presenceLabel}
                icon={keyFactIconFromLabel('Location')}
              />
            ) : null}
            <RatingStatTile
              average={avgRating}
              count={reviews.length}
              rateHref="#shop-detail-reviews"
            />
            {shop.communityInfo?.deliveryOffered ? (
              <StatTile
                label="Delivery"
                value={
                  shop.communityInfo.deliveryRadiusKm != null
                    ? `Within ${shop.communityInfo.deliveryRadiusKm} km`
                    : 'Offered'
                }
                icon={keyFactIconFromLabel('Delivery')}
              />
            ) : null}
          </StatGrid>
        }
      >
        {website ? (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 md:hidden"
          >
            Visit shop website
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        ) : null}

        <SectionCard id="shop-detail-about" title={CONSUMER_DETAIL_OVERVIEW_LABEL} tone="amber">
          {shop.description ? (
            <p className="text-base leading-relaxed text-gray-700 lg:text-[13px] lg:leading-relaxed">
              {shop.description}
            </p>
          ) : (
            <p className="text-sm text-neutral-500">No description yet.</p>
          )}
        </SectionCard>

        <SectionCard id="shop-detail-location" title="Location & contact" tone="sky">
          <ShopContactSection
            shop={{
              region: shop.region ?? undefined,
              latitude: shop.latitude ?? null,
              longitude: shop.longitude ?? null,
              contactEmail: shop.contactEmail ?? undefined,
              contactPhone: shop.contactPhone ?? undefined,
              contactPersonName: shop.contactPersonName ?? undefined,
              contactPersonAvatar: shop.contactPersonAvatar ?? undefined,
              contactPersonUserId: shop.contactPersonUserId ?? undefined,
              allowInboundChat: shop.allowInboundChat === true,
            }}
          />
        </SectionCard>

        {reviewTargetId ? (
          <SectionCard id="shop-detail-reviews" title="Reviews" tone="violet">
            <ReviewSection
              targetType="tenant"
              targetId={reviewTargetId}
              reviews={reviews}
              accent="amber"
              onReviewSubmitted={(review) => setReviews((prev) => [review, ...prev])}
            />
          </SectionCard>
        ) : null}
      </DetailPageShell>
    </>
  );
};
