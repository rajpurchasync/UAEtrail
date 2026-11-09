import type { MemberBrowseCardDTO } from '@uaetrail/shared-types';
import { CrewsGuidesRail } from './CrewsGuidesRail';
import { filterCrewsGuideDirectoryCards } from './crewsGuides';
import { CREWS_STAT_TAB_LABELS, type CrewsStatTab } from './crewsStatTab';

type CrewsHubHomeProps = {
  directory: MemberBrowseCardDTO[];
  buddiesCount: number;
  availableCount: number;
  everyoneCount: number;
  onSelectTab: (tab: CrewsStatTab) => void;
};

const teaserClass =
  'flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-left ring-1 ring-neutral-200/80 transition hover:bg-neutral-50';

export const CrewsHubHome = ({
  directory,
  buddiesCount,
  availableCount,
  everyoneCount,
  onSelectTab,
}: CrewsHubHomeProps) => {
  const guides = filterCrewsGuideDirectoryCards(directory);
  const teasers: { tab: CrewsStatTab; count: number; blurb: string }[] = [
    { tab: 'buddies', count: buddiesCount, blurb: 'Friends and people you follow with outings coming up' },
    { tab: 'available', count: availableCount, blurb: 'Looking for crew or free on the calendar' },
    { tab: 'everyone', count: everyoneCount, blurb: 'Discover hosts, guides, and members nearby' },
  ];

  return (
    <>
      <CrewsGuidesRail guides={guides} onBrowseEveryone={() => onSelectTab('everyone')} />
      <section aria-labelledby="crews-hub-teasers">
        <h2 id="crews-hub-teasers" className="mb-2 text-base font-bold text-neutral-900">
          Find your crew
        </h2>
        <ul className="space-y-2">
          {teasers.map(({ tab, count, blurb }) => (
            <li key={tab}>
              <button type="button" className={teaserClass} onClick={() => onSelectTab(tab)}>
                <span className="min-w-0 pr-3">
                  <span className="block text-sm font-bold text-neutral-900">{CREWS_STAT_TAB_LABELS[tab]}</span>
                  <span className="mt-0.5 block text-xs text-neutral-600">{blurb}</span>
                </span>
                <span className="shrink-0 tabular-nums text-lg font-bold text-emerald-700">{count}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
};