import { Link } from 'react-router-dom';
import { BrowseItemLink } from '../discoverySessionListBrowseLink';
import { DiscoveryBrowseCardMetaLine } from './DiscoveryBrowseCardMetaLine';

type DiscoveryBrowseCardMetaSlotProps = {
  line: string;
  href?: string | null;
  onMapHover?: (exploreItemId: string | null) => void;
  /** Map peek — plain router link (no list hover wiring). */
  mode?: 'list' | 'peek';
};

const linkClass = 'block min-w-0 rounded-md transition hover:bg-neutral-50 hover:underline';

/** S3 meta — plain text or link to geo hub / area guide (not nested inside card title link). */
export const DiscoveryBrowseCardMetaSlot = ({
  line,
  href = null,
  onMapHover,
  mode = 'list',
}: DiscoveryBrowseCardMetaSlotProps) => {
  const text = <DiscoveryBrowseCardMetaLine>{line}</DiscoveryBrowseCardMetaLine>;
  if (!href) return text;

  if (mode === 'peek') {
    return (
      <Link to={href} className={linkClass} onClick={(e) => e.stopPropagation()}>
        {text}
      </Link>
    );
  }

  return (
    <BrowseItemLink
      to={href}
      exploreItemId={null}
      onMapHover={onMapHover}
      className={linkClass}
    >
      {text}
    </BrowseItemLink>
  );
};