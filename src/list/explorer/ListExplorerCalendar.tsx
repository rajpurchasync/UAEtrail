import { useMemo, useState } from 'react';
import { formatExploreEventDateLabel } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { MobileMonthCalendar } from '../../components/mobile/MobileMonthCalendar';
import { todayIso } from '../../discovery/discoveryPortExploreActivityDate';
import { EXPLORE_TYPE } from '../../config/exploreTheme';
import { BrowseCompactRow } from '../browse/BrowseCompactRow';
import { browseCardDateIso } from '../browse/browseCardMeta';

type ListExplorerCalendarProps = {
  cards: DiscoveryCardModel[];
  onMapHover?: (exploreItemId: string | null) => void;
};

const formatDayHeading = (iso: string): string => formatExploreEventDateLabel(iso) ?? iso;

export const ListExplorerCalendar = ({ cards, onMapHover }: ListExplorerCalendarProps) => {
  const byDate = useMemo(() => {
    const map = new Map<string, DiscoveryCardModel[]>();
    for (const card of cards) {
      const iso = browseCardDateIso(card);
      if (!iso) continue;
      const list = map.get(iso);
      if (list) list.push(card);
      else map.set(iso, [card]);
    }
    return map;
  }, [cards]);

  const markedDates = useMemo(() => new Set(byDate.keys()), [byDate]);
  const undated = useMemo(() => cards.filter((card) => !browseCardDateIso(card)), [cards]);

  const today = todayIso();
  const initial =
    markedDates.has(today) ? today : [...markedDates].sort()[0] ?? today;
  const [selectedDate, setSelectedDate] = useState(initial);
  const dayCards = byDate.get(selectedDate) ?? [];

  return (
    <div className="space-y-4">
      <MobileMonthCalendar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        markedDates={markedDates}
      />
      <div>
        <p className={`mb-2 text-sm font-semibold ${EXPLORE_TYPE.muted}`}>
          {formatDayHeading(selectedDate)}
          {dayCards.length > 0 ? ` · ${dayCards.length}` : ''}
        </p>
        {dayCards.length === 0 ? (
          <p className={`rounded-2xl bg-white px-4 py-6 text-center text-sm ${EXPLORE_TYPE.muted}`}>
            Nothing scheduled this day.
          </p>
        ) : (
          <ul className="space-y-2">
            {dayCards.map((card) => (
              <li key={card.id}>
                <BrowseCompactRow card={card} onMapHover={onMapHover} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {undated.length > 0 ? (
        <div>
          <p className={`mb-2 text-sm font-semibold ${EXPLORE_TYPE.muted}`}>Anytime · {undated.length}</p>
          <ul className="space-y-2">
            {undated.map((card) => (
              <li key={card.id}>
                <BrowseCompactRow card={card} onMapHover={onMapHover} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};
