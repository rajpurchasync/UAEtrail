import type { JourneyMapEntryDTO, JourneyMapFilterCategory } from '@uaetrail/shared-types';
import { ConsumerBottomSheet } from '../mobile/ConsumerBottomSheet';
import { JourneyMapFilterScroll } from './JourneyMapFilterScroll';
import { JourneyMapListView } from './JourneyMapListView';

interface JourneyMapListSheetProps {
  open: boolean;
  filter: JourneyMapFilterCategory;
  entries: JourneyMapEntryDTO[];
  allEntries: JourneyMapEntryDTO[];
  onClose: () => void;
  onFilterChange: (filter: JourneyMapFilterCategory) => void;
  onSelect: (entry: JourneyMapEntryDTO) => void;
  emptyMessage?: string;
}

export const JourneyMapListSheet = ({
  open,
  filter,
  entries,
  allEntries,
  onClose,
  onFilterChange,
  onSelect,
  emptyMessage,
}: JourneyMapListSheetProps) => {
  const countLabel = entries.length === 1 ? '1 place' : `${entries.length} places`;

  return (
    <ConsumerBottomSheet
      open={open}
      title="My map"
      subtitle={countLabel}
      onClose={onClose}
      zIndex={1500}
      toolbar={
        <JourneyMapFilterScroll filter={filter} entries={allEntries} onChange={onFilterChange} variant="inline" />
      }
    >
      <JourneyMapListView entries={entries} onSelect={onSelect} emptyMessage={emptyMessage} />
    </ConsumerBottomSheet>
  );
};
