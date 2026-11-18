import type { ReactNode } from 'react';
import { EXPLORE_PEEK_CTA } from '../../../../config/exploreTheme';

export const PeekDualActionFooter = ({
  primary,
  iconAction,
  extra,
}: {
  primary: ReactNode;
  iconAction?: ReactNode;
  extra?: ReactNode;
}) => (
  <div className="space-y-1.5" data-peek-dual-footer>
    <div className="flex gap-1.5">
      <div className="min-w-0 flex-1">{primary}</div>
      {iconAction ? <div className="shrink-0">{iconAction}</div> : null}
    </div>
    {extra ? <div className={`grid gap-1.5 ${EXPLORE_PEEK_CTA.secondaryText}`}>{extra}</div> : null}
  </div>
);