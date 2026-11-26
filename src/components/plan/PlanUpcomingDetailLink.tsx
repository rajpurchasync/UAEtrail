import { Link, type LinkProps } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { planUpcomingEntityLinkState } from '@/discovery/discoveryPortExploreRouting';
import { isPlanSummaryFocusScrollGuardActive } from '../../plan/planSummaryFocusScroll';
import { capturePlanUpcomingViewReturn } from '../../plan/planUpcomingReturnCapture';
import { viewReturnPathKey } from '../../utils/viewReturnMemory';

type PlanUpcomingDetailLinkProps = Omit<LinkProps, 'state'> & {
  navFocus: string;
};

/** Upcoming commitment row → activity detail with scroll + focus restore on back. */
export const PlanUpcomingDetailLink = ({
  navFocus,
  onClick,
  to,
  children,
  ...rest
}: PlanUpcomingDetailLinkProps) => {
  const location = useLocation();
  const returnTo = viewReturnPathKey(location.pathname, location.search);

  return (
    <Link
      to={to}
      state={planUpcomingEntityLinkState(returnTo)}
      data-nav-focus={navFocus}
      onClick={(event) => {
        if (isPlanSummaryFocusScrollGuardActive()) {
          event.preventDefault();
          return;
        }
        capturePlanUpcomingViewReturn(location.pathname, location.search);
        onClick?.(event);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
};
