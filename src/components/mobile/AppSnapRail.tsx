import { ReactNode } from 'react';

interface AppSnapRailProps {
  children: ReactNode;
  /** Horizontal peek on mobile (82vw cards). */
  peek?: boolean;
  /** Desktop grid columns. */
  desktopCols?: 2 | 3 | 4;
  className?: string;
}

const gridColsClass: Record<NonNullable<AppSnapRailProps['desktopCols']>, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
};

/** Horizontal snap rail on mobile; grid on md+. */
export const AppSnapRail = ({
  children,
  peek = false,
  desktopCols = 3,
  className = '',
}: AppSnapRailProps) => (
  <div
    className={`mobile-snap-rail ${peek ? 'mobile-snap-rail--peek' : ''} md:grid md:gap-4 ${gridColsClass[desktopCols]} ${className}`.trim()}
  >
    {children}
  </div>
);

interface AppSnapRailItemProps {
  children: ReactNode;
  peek?: boolean;
  className?: string;
}

export const AppSnapRailItem = ({ children, peek = false, className = '' }: AppSnapRailItemProps) => (
  <div
    className={`${peek ? 'mobile-snap-rail__item' : 'mobile-snap-rail__item md:min-w-0'} ${className}`.trim()}
  >
    {children}
  </div>
);
