import type { ReactNode } from 'react';
import { CONSUMER_DETAIL_KEY_FACTS_LABEL } from '../../content/consumerDetailSectionLabels';

export const StatGrid = ({
  children,
  label = CONSUMER_DETAIL_KEY_FACTS_LABEL,
}: {
  children: ReactNode;
  label?: string;
}) => {
  if (!children) return null;
  const showLabel = Boolean(label?.trim());
  return (
    <section aria-label={showLabel ? label : undefined} className={showLabel ? 'mb-4 lg:mb-3' : ''}>
      {showLabel ? (
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 lg:mb-1.5">
          {label}
        </p>
      ) : null}
      <div className="-ms-1 grid grid-cols-3 gap-2 sm:grid-cols-3 md:grid-cols-4 md:gap-2.5 lg:ms-0 lg:gap-3">
        {children}
      </div>
    </section>
  );
};
