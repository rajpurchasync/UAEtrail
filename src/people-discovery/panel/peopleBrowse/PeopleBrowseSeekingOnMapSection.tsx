import type { MemberDiscoverySeekingRowDTO } from '@uaetrail/shared-types';
import { EXPLORE_TYPE } from '../../../config/exploreTheme';
import { EXPLORE_PEOPLE_BROWSE_DISCOVER_LOOKING_TITLE } from '../../../content/explorePeopleBrowseCopy';
import { buildMemberBrowseRowFromSeeking } from '../../memberBrowseRowModel';
import { PEOPLE_BROWSE_LIST_STACK } from './peopleBrowseListTheme';
import { PeopleBrowseMemberRow } from './PeopleBrowseMemberRow';

type PeopleBrowseSeekingOnMapSectionProps = {
  rows: MemberDiscoverySeekingRowDTO[];
};

/** Active Find posts — row opens explore pin/peek (same routing as map cards). */
export const PeopleBrowseSeekingOnMapSection = ({ rows }: PeopleBrowseSeekingOnMapSectionProps) => {
  if (rows.length === 0) return null;

  return (
    <section className="mb-5" aria-labelledby="people-browse-seeking-heading">
      <h3
        id="people-browse-seeking-heading"
        className={`mb-2 text-xs font-bold uppercase tracking-wide ${EXPLORE_TYPE.caption}`}
      >
        {EXPLORE_PEOPLE_BROWSE_DISCOVER_LOOKING_TITLE}
      </h3>
      <ul className={PEOPLE_BROWSE_LIST_STACK}>
        {rows.map((row) => {
          const { key, userId: _userId, ...props } = buildMemberBrowseRowFromSeeking(row);
          return (
            <li key={key}>
              <PeopleBrowseMemberRow {...props} />
            </li>
          );
        })}
      </ul>
    </section>
  );
};
