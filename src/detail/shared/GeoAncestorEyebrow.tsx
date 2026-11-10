import type { GeoAncestorLink } from '../../geo/geoAncestorLinks';
import { GeoGuestDrillLink } from '../../geo/GeoGuestDrillLink';

const HERO_CRUMB_CLASS =
  'underline decoration-white/40 underline-offset-[3px] hover:text-white';

type GeoAncestorEyebrowProps = {
  links: GeoAncestorLink[];
  fallbackLabel?: string | null;
  linkState?: object;
};

/** Clickable country / emirate trail on a detail hero. */
export const GeoAncestorEyebrow = ({ links, fallbackLabel, linkState }: GeoAncestorEyebrowProps) => {
  if (links.length === 0) {
    const label = fallbackLabel?.trim();
    if (!label) return null;
    return <span>{label}</span>;
  }

  const ordered = [...links].reverse();

  return (
    <span>
      {ordered.map((link, index) => (
        <span key={link.href}>
          {index > 0 ? <span aria-hidden> · </span> : null}
          <GeoGuestDrillLink
            to={link.href}
            state={linkState}
            authReturnPath={link.href}
            inline
            className={HERO_CRUMB_CLASS}
          >
            {link.label}
          </GeoGuestDrillLink>
        </span>
      ))}
    </span>
  );
};
