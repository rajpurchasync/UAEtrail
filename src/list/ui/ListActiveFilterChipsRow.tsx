import { X } from 'lucide-react';
import type { ListActiveFilterChip } from '../listActiveFilterChips';
import { LIST_CHIP_SCROLL } from '../listChromeTheme';

interface ListActiveFilterChipsRowProps {
  chips: ListActiveFilterChip[];
  onClear: (chip: ListActiveFilterChip) => void;
}

export const ListActiveFilterChipsRow = ({ chips, onClear }: ListActiveFilterChipsRowProps) => (
  <div className={`${LIST_CHIP_SCROLL} gap-2`}>
    {chips.map((chip) => (
      <button
        key={chip.key}
        type="button"
        onClick={() => onClear(chip)}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-900 py-1.5 pl-3 pr-2 text-xs font-semibold text-white active:opacity-90"
      >
        {chip.label}
        <X className="h-3.5 w-3.5 opacity-80" aria-hidden />
      </button>
    ))}
  </div>
);
