import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { PRODUCT_JOIN_CTA } from '../../content/productNorthStar';
import {
  EXPLORE_GUEST_MAP_PREVIEW_ALERT_EMOJI,
  EXPLORE_GUEST_MAP_PREVIEW_CTA_SUFFIX,
  EXPLORE_GUEST_MAP_PREVIEW_LEAD,
} from '../exploreBrowseTaxonomy';
import { buildAuthGateUrls } from '../../utils/authReturnContext';

type GuestCatalogPreviewBannerProps = {
  onDismiss: () => void;
  className?: string;
};

/** Shared guest catalog preview card — map overlay and list both render this. */
export const GuestCatalogPreviewBanner = ({
  onDismiss,
  className = '',
}: GuestCatalogPreviewBannerProps) => {
  const location = useLocation();
  const returnPath = `${location.pathname}${location.search}`;
  const { signUpHref } = buildAuthGateUrls(location, { returnPath });

  return (
    <div
      role="status"
      className={`explore-guest-map-preview-banner relative w-full max-w-md px-4 py-3 pr-11 ${className}`}
    >
      <p className="text-center text-[0.8125rem] leading-snug">
        <span className="explore-guest-map-preview-banner__lead block">
          <span aria-hidden="true">{EXPLORE_GUEST_MAP_PREVIEW_ALERT_EMOJI} </span>
          {EXPLORE_GUEST_MAP_PREVIEW_LEAD}
        </span>
        <span className="explore-guest-map-preview-banner__cta mt-1.5 block">
          <Link to={signUpHref} className="explore-guest-map-preview-banner__link font-bold">
            {PRODUCT_JOIN_CTA}
          </Link>{' '}
          {EXPLORE_GUEST_MAP_PREVIEW_CTA_SUFFIX}
        </span>
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="explore-guest-map-preview-banner__dismiss absolute right-2 top-2 rounded-lg p-1.5"
        aria-label="Dismiss preview notice"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
};
