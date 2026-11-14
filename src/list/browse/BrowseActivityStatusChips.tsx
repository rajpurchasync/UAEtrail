import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { resolveActivityPeekStatusChips } from '../../activity/resolveActivityPeekStatusChips';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';
import { BROWSE_CARD_CHIP } from './browseCardChrome';

type BrowseActivityStatusChipsProps = {
  card: DiscoveryCardModel;
  joinUiState?: JoinRequestUiState;
};

const toneClass = (tone: 'joined' | 'pending' | 'waitlist') => {
  if (tone === 'joined') return 'bg-emerald-100 text-emerald-900';
  if (tone === 'waitlist') return 'bg-sky-100 text-sky-900';
  return 'bg-amber-100 text-amber-900';
};

/** Trips bucket — Joined / Pending chips (parity with map peek). */
export const BrowseActivityStatusChips = ({
  card,
  joinUiState,
}: BrowseActivityStatusChipsProps) => {
  const chips = resolveActivityPeekStatusChips(card, joinUiState);
  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1" aria-label="Your status on this plan">
      {chips.map((chip) => (
        <li key={`${chip.tone}-${chip.label}`} className={`${BROWSE_CARD_CHIP} ${toneClass(chip.tone)}`}>
          {chip.label}
        </li>
      ))}
    </ul>
  );
};