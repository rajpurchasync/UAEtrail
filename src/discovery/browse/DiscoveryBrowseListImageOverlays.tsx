import {
  BROWSE_LIST_HERO_POLICY_CHIP,
  BROWSE_LIST_HERO_POLICY_GAP,
  BROWSE_LIST_HERO_PRICE_CHIP,
  BROWSE_LIST_HERO_SOLD_OUT_CHIP,
} from './discoveryBrowseListChrome';

const PolicyChips = ({ labels }: { labels: string[] }) => (
  <ul className={`flex flex-wrap ${BROWSE_LIST_HERO_POLICY_GAP}`}>
    {labels.map((label) => (
      <li key={label}>
        <span className={BROWSE_LIST_HERO_POLICY_CHIP}>{label}</span>
      </li>
    ))}
  </ul>
);

/** Policy chips along the bottom edge of list browse hero photos (S4 on media). */
export const DiscoveryBrowseListPolicyOverlay = ({ labels }: { labels: string[] }) => {
  if (labels.length === 0) return null;

  return (
    <PolicyChips labels={labels} />
  );
};

type DiscoveryBrowseListHeroFootOverlayProps = {
  priceLabel?: string | null;
  soldOut?: boolean;
  policyLabels: string[];
};

/** Photo foot — price/free above audience policy chips. */
export const DiscoveryBrowseListHeroFootOverlay = ({
  priceLabel = null,
  soldOut = false,
  policyLabels,
}: DiscoveryBrowseListHeroFootOverlayProps) => {
  const showPrice = soldOut || Boolean(priceLabel?.trim());
  if (!showPrice && policyLabels.length === 0) return null;

  const priceText = soldOut ? 'Sold out' : priceLabel?.trim() ?? '';

  return (
    <div className="flex w-full flex-col items-start gap-1.5" aria-label="Price and plan details">
      {showPrice ? (
        <span className={soldOut ? BROWSE_LIST_HERO_SOLD_OUT_CHIP : BROWSE_LIST_HERO_PRICE_CHIP}>{priceText}</span>
      ) : null}
      {policyLabels.length > 0 ? <PolicyChips labels={policyLabels} /> : null}
    </div>
  );
};