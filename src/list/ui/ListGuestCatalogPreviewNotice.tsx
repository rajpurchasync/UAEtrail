import { Link, useLocation } from 'react-router-dom';
import { PRODUCT_JOIN_CTA } from '../../content/productNorthStar';
import { LIST_GUEST_CATALOG_PREVIEW_NOTICE } from '../browseListCopy';
import { AppButtonLink } from '../../components/mobile/AppButton';
import { buildAuthGateUrls } from '../../utils/authReturnContext';

const loginChipClass =
  'ios-btn flex min-h-9 min-w-0 flex-1 items-center justify-center rounded-xl border border-emerald-200/90 bg-white px-3 py-2 text-center text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50/80 active:bg-emerald-50';

type Props = {
  className?: string;
};

/** Standalone `/list` — guest catalog is capped server-side (3 places + 3 activities). */
export const ListGuestCatalogPreviewNotice = ({ className = '' }: Props) => {
  const location = useLocation();
  const returnPath = `${location.pathname}${location.search}`;
  const { signInHref, signUpHref } = buildAuthGateUrls(location, { returnPath });

  return (
    <div
      className={`rounded-xl border border-amber-100 bg-amber-50/90 px-3 py-2.5 text-left ${className}`}
      role="status"
    >
      <p className="text-[11px] leading-snug text-amber-950 sm:text-xs">{LIST_GUEST_CATALOG_PREVIEW_NOTICE}</p>
      <div className="mt-2 flex flex-row gap-2">
        <AppButtonLink to={signUpHref} className="min-h-9 min-w-0 flex-1 px-3 py-2 text-xs">
          {PRODUCT_JOIN_CTA}
        </AppButtonLink>
        <Link to={signInHref} className={loginChipClass}>
          Log in
        </Link>
      </div>
    </div>
  );
};
