import { EXPLORE_TYPE } from '../../config/exploreTheme';

type DiscoveryBrowseCardMetaLineProps = {
  children: string;
  className?: string;
};

/** Muted S3 line under browse card title (list + peek). */
export const DiscoveryBrowseCardMetaLine = ({
  children,
  className = '',
}: DiscoveryBrowseCardMetaLineProps) => (
  <p
    className={`min-w-0 truncate text-[12px] font-medium leading-snug text-neutral-600 ${EXPLORE_TYPE.muted} ${className}`.trim()}
  >
    {children}
  </p>
);