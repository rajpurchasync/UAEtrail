import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Info, MapPin } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { ReviewDTO } from '@uaetrail/shared-types';
import { PageMeta } from '../seo/PageMeta';
import { EntityPublicDetailShell } from '../entity-public/EntityPublicDetailShell';
import { ConsumerEntityTabBar } from '../mobile/ConsumerEntityTabBar';
import {
  SHOP_PUBLIC_TAB_LABELS,
  SHOP_PUBLIC_TABS,
  SHOP_PUBLIC_TAB_QUERY,
  parseShopPublicDetailTabParam,
  type ShopPublicDetailTabId,
} from '../../shop/shopPublicDetailTab';
import { ShopContactSection } from './ShopContactSection';
import { ShareButton } from '../ui/ShareButton';
import { ReviewSection } from '../ui/ReviewSection';
import { CatalogRatingSummary, DetailReviewFooter, scrollToReviewAnchor } from '../ui/DetailReviewChrome';
import { detailBackPath } from '../../config/routingCatalog';
import { shopPublicPath } from '../../utils/shopPaths';
import { fetchOrganisationReviews } from '../../hooks/organisationConsoleApi';
import { useAuth } from '../../context/AuthContext';
import {
  ADD_PLACE_PENDING_BANNER_BODY,
  ADD_PLACE_PENDING_BANNER_TITLE,
} from '../../explore/createFlowCopy';

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

/** Unified public gear-shop page — profile, contact, and outbound website link. */
const SHOP_TAB_ICONS = {
  about: Info,
  location: MapPin,
} as const;

export const ShopPublicPage = ({ shop }: ShopPublicPageProps) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseShopPublicDetailTabParam(searchParams.get(SHOP_PUBLIC_TAB_QUERY));
  const onTabChange = (tab: ShopPublicDetailTabId) => {
    const next = new URLSearchParams(searchParams);
    next.set(SHOP_PUBLIC_TAB_QUERY, tab);
    setSearchParams(next, { replace: true });
  };

  const publicPath = shopPublicPath({ merchantId: shop.id });
  const mapBack = detailBackPath('shop');
  const website = shop.websiteUrl?.trim() || null;
  const reviewTargetId = shop.reviewTargetId?.trim() || null;
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);

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

  const userReview = useMemo(
    () => (user ? reviews.find((review) => review.userId === user.id) : undefined),
    [reviews, user]
  );

  const reviewFooter = reviewTargetId ? <DetailReviewFooter userReview={userReview} accent="amber" /> : undefined;

  const mobileTabs = SHOP_PUBLIC_TABS.map((id) => ({
    id,
    label: SHOP_PUBLIC_TAB_LABELS[id],
    icon: SHOP_TAB_ICONS[id],
  }));

  const tabClass = (tab: ShopPublicDetailTabId) =>
    `py-3 text-sm font-semibold border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-amber-600 text-amber-800'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`;

  return (
    <EntityPublicDetailShell
      backTo={mapBack}
      backLabel="Explore"
      showMenu={false}
      footer={reviewFooter}
      maxWidthClass="max-w-5xl"
      headerAction={
        <ShareButton
          title={shop.shopName}
          text={shop.description?.slice(0, 120) ?? `${shop.shopName} on UAE Trail`}
          path={publicPath}
          iconOnly
          light
        />
      }
    >
      <PageMeta
        title={shop.shopName}
        description={shop.description?.slice(0, 160) ?? `${shop.shopName} on UAE Trail`}
        path={publicPath}
        image={shop.logo ?? undefined}
        imageAlt={shop.shopName}
      />

      <div className="-mx-4 px-4 md:mx-0 md:px-0">
        {shop.communityInfo?.status === 'draft' ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">{ADD_PLACE_PENDING_BANNER_TITLE}</p>
            <p className="mt-1 text-amber-900/90">{ADD_PLACE_PENDING_BANNER_BODY}</p>
          </div>
        ) : null}
        <section className="flex items-start gap-4 md:gap-6">
          {shop.logo ? (
            <img src={shop.logo} alt="" className="h-16 w-16 rounded-2xl object-cover md:h-20 md:w-20" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl md:h-20 md:w-20 md:text-2xl">
              🛍️
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-snug text-gray-900 lg:text-xl">{shop.shopName}</h1>
            {shop.region && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {shop.presence === 'online' ? `${shop.region} · Online` : shop.region}
              </p>
            )}
            {shop.presence === 'online' && !shop.region && (
              <p className="mt-1 text-sm text-gray-500">Online partner · ships to UAE</p>
            )}
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
              {shop.communityInfo
                ? 'Community map info'
                : shop.presence === 'online'
                  ? 'Online gear partner'
                  : 'Gear shop'}
            </p>
            {reviewTargetId && <CatalogRatingSummary reviews={reviews} className="mt-2" />}
          </div>
          <ShareButton
            title={shop.shopName}
            text={shop.description?.slice(0, 120) ?? `${shop.shopName} on UAE Trail`}
            path={publicPath}
            className="hidden shrink-0 md:block"
          />
        </section>

        <ConsumerEntityTabBar
          tabs={mobileTabs}
          active={activeTab}
          onChange={onTabChange}
          ariaLabel="Shop sections"
          className="mt-6"
        />

        <nav className="mt-4 hidden md:flex gap-6 border-b">
          {SHOP_PUBLIC_TABS.map((id) => (
            <button key={id} type="button" onClick={() => onTabChange(id)} className={tabClass(id)}>
              {SHOP_PUBLIC_TAB_LABELS[id]}
            </button>
          ))}
        </nav>

        {activeTab === 'about' && (
          <div className="mt-6 space-y-8">
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Visit shop website
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            )}

            {shop.description ? (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">About</h2>
                <p className="mt-3 text-base leading-relaxed text-gray-700">{shop.description}</p>
              </section>
            ) : (
              <p className="text-sm text-neutral-500">No description yet.</p>
            )}

            {reviewTargetId && (
              <ReviewSection
                targetType="tenant"
                targetId={reviewTargetId}
                reviews={reviews}
                accent="amber"
                onReviewSubmitted={(review) => setReviews((prev) => [review, ...prev])}
              />
            )}

            {reviewTargetId && (
              <div className="hidden md:block">
                <DetailReviewFooter userReview={userReview} accent="amber" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'location' && (
          <div className="mt-6">
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
              }}
            />
          </div>
        )}
      </div>
    </EntityPublicDetailShell>
  );
};
