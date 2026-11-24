import { useMemo } from 'react';
import type { CommunityDiscoverCardDTO } from '@uaetrail/shared-types';
import { buildDiscoveryCardModelFromCommunityDiscover } from '@/discovery/buildCommunityDiscoverCardModel';
import { BrowseCompactRow } from '../browse/BrowseCompactRow';
import { CREW_BROWSE_LIST_STACK } from '@/crew-discovery/panel/crewBrowse/crewBrowseListTheme';

type CommunityDiscoverBrowseListProps = {
  rows: CommunityDiscoverCardDTO[];
  /** Kept for call sites; list layout matches trips (`BrowseCompactRow`). */
  compact?: boolean;
};

export const CommunityDiscoverBrowseList = ({ rows }: CommunityDiscoverBrowseListProps) => {
  const cards = useMemo(
    () => rows.map((row) => buildDiscoveryCardModelFromCommunityDiscover(row)),
    [rows]
  );

  return (
    <ul className={CREW_BROWSE_LIST_STACK}>
      {cards.map((card) => (
        <li key={card.id}>
          <BrowseCompactRow card={card} />
        </li>
      ))}
    </ul>
  );
};