import { Link, type LinkProps } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { planWishlistEntityLinkState } from '@/discovery/discoveryPortExploreMapPeekNav';
import { capturePlanWishlistViewReturn } from '../../plan/planWishlistReturnCapture';

type PlanWishlistDetailLinkProps = Omit<LinkProps, 'state'> & {
  navFocus: string;
};

/** Wishlist / saved-match → activity or place detail with scroll + focus restore on back. */
export const PlanWishlistDetailLink = ({
  navFocus,
  onClick,
  to,
  children,
  ...rest
}: PlanWishlistDetailLinkProps) => {
  const location = useLocation();

  return (
    <Link
      to={to}
      state={planWishlistEntityLinkState()}
      data-nav-focus={navFocus}
      onClick={(event) => {
        capturePlanWishlistViewReturn(location.pathname, location.search);
        onClick?.(event);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
};
