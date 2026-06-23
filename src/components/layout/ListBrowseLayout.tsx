import { ReactNode } from 'react';

interface ListBrowseLayoutProps {
  /** Filter / facet sidebar — desktop only */
  sidebar?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Two-column browse layout: optional left filters + main list.
 * Intentionally no third (preview) column — use ComposeRail at the app frame level.
 */
export const ListBrowseLayout = ({ sidebar, children, className = '' }: ListBrowseLayoutProps) => (
  <div className={`flex flex-col lg:flex-row gap-6 lg:gap-8 ${className}`}>
    {sidebar}
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);
