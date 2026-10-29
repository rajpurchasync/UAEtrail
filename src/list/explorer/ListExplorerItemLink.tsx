import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { listExplorerEntityLinkState } from './listExplorerNavState';

type ListExplorerItemLinkProps = {
  to: string;
  className?: string;
  children: ReactNode;
};

/** Detail / place / shop from the list explorer — back returns here after nested screens. */
export const ListExplorerItemLink = ({ to, className, children }: ListExplorerItemLinkProps) => {
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;
  return (
    <Link to={to} state={listExplorerEntityLinkState(returnTo)} className={className}>
      {children}
    </Link>
  );
};
