import { DirectionsControl } from './DirectionsControl';

interface PlaceDirectionLinksProps {
  lat: number;
  lng: number;
  className?: string;
}

/** Map navigation — see `docs/DOMAIN_CANONICALS.md` §14. Wraps {@link DirectionsControl}. */
export const PlaceDirectionLinks = ({ lat, lng, className = '' }: PlaceDirectionLinksProps) => (
  <DirectionsControl lat={lat} lng={lng} variant="compact" className={className} />
);

