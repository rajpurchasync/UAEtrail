import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useExploreMapChrome } from '../../explore/ExploreMapChromeContext';
import { listExplorerEntityLinkState } from './listExplorerNavState';

type ListExplorerItemLinkProps = {
  to: string;
  className?: string;
  exploreItemId?: string | null;
  children: ReactNode;
};

const isDesktopHover = () =>
  typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

/** Detail / place / shop from the list explorer — back returns here after nested screens. */
export const ListExplorerItemLink = ({
  to,
  className,
  exploreItemId,
  children,
}: ListExplorerItemLinkProps) => {
  const location = useLocation();
  const chrome = useExploreMapChrome();
  const returnTo = `${location.pathname}${location.search}`;
  return (
    <Link
      to={to}
      state={listExplorerEntityLinkState(returnTo)}
      className={className}
      onMouseEnter={() => {
        if (!exploreItemId || !isDesktopHover()) return;
        chrome?.setListHoverExploreItemId(exploreItemId);
      }}
      onMouseLeave={() => {
        if (!exploreItemId) return;
        chrome?.setListHoverExploreItemId(null);
      }}
    >
      {children}
    </Link>
  );
};
