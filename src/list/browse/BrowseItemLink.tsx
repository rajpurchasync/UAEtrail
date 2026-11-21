import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useExploreMapChrome } from '../../explore/ExploreMapChromeContext';
import { browseListEntityLinkState } from './browseListNavState';

type BrowseItemLinkProps = {
  to: string;
  className?: string;
  exploreItemId?: string | null;
  children: ReactNode;
  /** Standalone list side map — hover sync without explore chrome. */
  onMapHover?: (exploreItemId: string | null) => void;
};

const isDesktopHover = () =>
  typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

/** Entity navigation from browse layouts — return stack preserves list/explore URL. */
export const BrowseItemLink = ({
  to,
  className,
  exploreItemId,
  children,
  onMapHover,
}: BrowseItemLinkProps) => {
  const location = useLocation();
  const chrome = useExploreMapChrome();
  const returnTo = `${location.pathname}${location.search}`;

  const emitHover = (id: string | null) => {
    if (onMapHover) {
      onMapHover(id);
      return;
    }
    if (!isDesktopHover()) return;
    chrome?.setListHoverExploreItemId(id);
  };

  return (
    <Link
      to={to}
      state={browseListEntityLinkState(returnTo)}
      className={className}
      onMouseEnter={() => {
        if (!exploreItemId) return;
        emitHover(exploreItemId);
      }}
      onMouseLeave={() => {
        if (!exploreItemId) return;
        emitHover(null);
      }}
    >
      {children}
    </Link>
  );
};