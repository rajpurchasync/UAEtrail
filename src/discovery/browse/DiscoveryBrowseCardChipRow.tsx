import type { ReactNode } from 'react';
import { BROWSE_CARD_CHIP } from '../discoveryPortListBrowseCard';

type DiscoveryBrowseCardChipRowProps = {
  labels: string[];
  /** Soft tint for logistics chips (e.g. trail access). */
  tone?: 'neutral' | 'logistics';
  maxVisible?: number;
  ariaLabel?: string;
  /** Override chip node (rare). */
  renderChip?: (label: string) => ReactNode;
};

/** Single capped policy / fact chip row (§6.1.3 S4). */
export const DiscoveryBrowseCardChipRow = ({
  labels,
  tone = 'neutral',
  maxVisible = 3,
  ariaLabel,
  renderChip,
}: DiscoveryBrowseCardChipRowProps) => {
  const visible = labels.slice(0, maxVisible);
  if (visible.length === 0) return null;

  const chipClass =
    tone === 'logistics' ? `${BROWSE_CARD_CHIP} bg-sky-50 text-sky-900` : BROWSE_CARD_CHIP;

  return (
    <ul className="flex flex-wrap gap-1" aria-label={ariaLabel}>
      {visible.map((label) => (
        <li key={label}>{renderChip ? renderChip(label) : <span className={chipClass}>{label}</span>}</li>
      ))}
    </ul>
  );
};