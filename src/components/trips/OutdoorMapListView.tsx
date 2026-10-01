import { MapPin } from 'lucide-react';
import type { OutdoorMapEntryDTO } from '@uaetrail/shared-types';
import { ActivityHubListRow } from '../mobile/ActivityHubListRow';
import { formatOutdoorListSubtitle } from '../../trips/outdoorMapListMeta';
import { outdoorEntryCategoryBadge } from '../../trips/outdoorMapCategoryBadge';
import { resolveOutdoorPinStyle } from '../../trips/outdoorMapPinStyle';
import { OutdoorMapListPinIcon } from './OutdoorMapListPinIcon';

interface OutdoorMapListViewProps {
  entries: OutdoorMapEntryDTO[];
  onSelect: (entry: OutdoorMapEntryDTO) => void;
  emptyMessage?: string;
}

export const OutdoorMapListView = ({ entries, onSelect, emptyMessage }: OutdoorMapListViewProps) => {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <MapPin className="mb-3 h-10 w-10 text-neutral-300" aria-hidden />
        <p className="text-sm leading-relaxed text-neutral-600">{emptyMessage ?? 'Nothing here yet.'}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => {
        const hasMap = entry.latitude != null && entry.longitude != null;
        const pinStyle = resolveOutdoorPinStyle(entry);
        const badge = outdoorEntryCategoryBadge(entry);
        const metaParts = [formatOutdoorListSubtitle(entry)];
        if (!hasMap) metaParts.push('No map location');

        return (
          <li key={entry.id}>
            <ActivityHubListRow
              title={entry.title}
              meta={metaParts.join(' · ')}
              leading={<OutdoorMapListPinIcon style={pinStyle} />}
              badge={
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badge.className}`}
                >
                  {badge.label}
                </span>
              }
              onClick={() => onSelect(entry)}
            />
          </li>
        );
      })}
    </ul>
  );
};
