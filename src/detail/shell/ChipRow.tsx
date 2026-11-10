import type { ReactNode } from 'react';

/** Hero / section chip strip. Logical padding so RTL does not break LTR. */
export const ChipRow = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  if (!children) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`} data-detail-chip-row>
      {children}
    </div>
  );
};
