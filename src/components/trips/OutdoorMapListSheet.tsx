import type { OutdoorMapEntryDTO, OutdoorMapFilterCategory } from '@uaetrail/shared-types';
import { ConsumerBottomSheet } from '../mobile/ConsumerBottomSheet';
import { OutdoorMapFilterScroll } from './OutdoorMapFilterScroll';
import { OutdoorMapListView } from './OutdoorMapListView';

interface OutdoorMapListSheetProps {
  open: boolean;
  filter: OutdoorMapFilterCategory;
  entries: OutdoorMapEntryDTO[];
  allEntries: OutdoorMapEntryDTO[];
  onClose: () => void;
  onFilterChange: (filter: OutdoorMapFilterCategory) => void;
  onSelect: (entry: OutdoorMapEntryDTO) => void;
  emptyMessage?: string;
}

export const OutdoorMapListSheet = ({
  open,
  filter,
  entries,
  allEntries,
  onClose,
  onFilterChange,
  onSelect,
  emptyMessage,
}: OutdoorMapListSheetProps) => {
  const countLabel = entries.length === 1 ? '1 place' : `${entries.length} places`;

  return (
    <ConsumerBottomSheet
      open={open}
      title="My outdoor map"
      subtitle={countLabel}
      onClose={onClose}
      zIndex={1500}
      toolbar={
        <OutdoorMapFilterScroll filter={filter} entries={allEntries} onChange={onFilterChange} variant="inline" />
      }
    >
      <OutdoorMapListView entries={entries} onSelect={onSelect} emptyMessage={emptyMessage} />
    </ConsumerBottomSheet>
  );
};
