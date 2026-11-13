import type { GeoNodeLite } from '@uaetrail/shared-types';
import { geoCountryPath, geoNodePath } from '../config/routingCatalog';

export type GeoAncestorLink = {
  label: string;
  href: string;
};

const norm = (value: string | undefined | null): string => value?.trim().toLowerCase() ?? '';

const nameMatches = (node: GeoNodeLite, needle: string): boolean => {
  if (!needle) return false;
  const name = node.n.toLowerCase();
  const slug = node.s.toLowerCase();
  const arabic = node.a?.toLowerCase() ?? '';
  const iso = node.iso?.toLowerCase() ?? '';
  return (
    name === needle ||
    slug === needle ||
    arabic === needle ||
    iso === needle ||
    name.startsWith(needle) ||
    slug.startsWith(needle)
  );
};

/** Country + emirate/state links for a curated area `region` label. */
export const pickGeoAncestorLinks = (
  nodes: Iterable<GeoNodeLite>,
  input: { region?: string | null; countryCode?: string | null }
): GeoAncestorLink[] => {
  const list = Array.from(nodes);
  const links: GeoAncestorLink[] = [];
  const countryCode = norm(input.countryCode);
  const region = norm(input.region);

  const country =
    (countryCode
      ? list.find((node) => node.kind === 'country' && nameMatches(node, countryCode))
      : undefined) ??
    (region ? list.find((node) => node.kind === 'country' && nameMatches(node, region)) : undefined);

  if (country) {
    const code = country.iso || country.s;
    links.push({
      label: country.n,
      href: code ? geoCountryPath(code) : geoNodePath(country.id),
    });
  }

  if (region && (!country || !nameMatches(country, region))) {
    const underCountry = country
      ? list.filter((node) => node.path.startsWith(`${country.path}/`) || node.p === country.id)
      : list;
    const state =
      underCountry.find((node) => node.kind === 'state' && nameMatches(node, region)) ??
      list.find((node) => node.kind === 'state' && nameMatches(node, region));
    if (state) {
      links.push({ label: state.n, href: geoNodePath(state.id) });
    }
  }

  return links;
};
