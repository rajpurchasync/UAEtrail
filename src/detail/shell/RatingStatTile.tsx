import type { ReactNode } from 'react';
import { PLACE_PEEK_RATE_LABEL } from '../../content/placePeekCopy';
import { keyFactIconFromLabel } from './keyFactIcons';
import { StatTile } from './StatTile';

type Props = {
  average?: number | null;
  count?: number;
  /** Anchor or path to the reviews / rate section (e.g. `#place-reviews`). */
  rateHref?: string;
  rateLabel?: string;
};

/** Key-facts chip for ratings — same shell as camping/difficulty StatTiles. */
export const RatingStatTile = ({
  average,
  count = 0,
  rateHref,
  rateLabel = PLACE_PEEK_RATE_LABEL,
}: Props) => {
  const hasRating = average != null && Number.isFinite(average) && count > 0;

  let value: ReactNode;
  if (hasRating) {
    value = `${average!.toFixed(1)} · ${count}`;
  } else if (rateHref) {
    value = (
      <>
        No ratings yet
        <span className="text-neutral-400 dark:text-neutral-500"> · </span>
        <a
          href={rateHref}
          className="font-semibold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
        >
          {rateLabel}
        </a>
      </>
    );
  } else {
    value = 'No ratings yet';
  }

  return (
    <StatTile
      label="Rating"
      value={value}
      icon={keyFactIconFromLabel('Rating')}
      showWhenEmpty
    />
  );
};
