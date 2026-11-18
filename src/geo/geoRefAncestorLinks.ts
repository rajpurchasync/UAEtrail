import { canonicalGeoNodeId, type GeoNodeLite, type GeoRef } from '@uaetrail/shared-types';
import { geoCountryPath, geoNodePath } from '../config/routingCatalog';
import type { GeoAncestorLink } from './geoAncestorLinks';

const nodeHref = (node: GeoNodeLite): string => {
  if (node.kind === 'country') {
    const code = node.iso?.trim() || node.s.trim();
    if (code) return geoCountryPath(code);
  }
  return geoNodePath(node.id);
};

/** Country → state → area links from `geoRef.chain` (excludes geo L4 venue — use hub path separately). */
export const pickGeoRefAncestorLinks = (
  nodes: Iterable<GeoNodeLite>,
  geoRef: GeoRef | null | undefined
): GeoAncestorLink[] => {
  if (!geoRef?.chain?.length) return [];
  const byId = new Map<string, GeoNodeLite>();
  for (const node of nodes) {
    byId.set(node.id, node);
  }
  const links: GeoAncestorLink[] = [];
  for (const rawId of geoRef.chain) {
    const id = canonicalGeoNodeId(rawId);
    const node = byId.get(id);
    if (!node || node.kind === 'venue') continue;
    links.push({ label: node.n, href: nodeHref(node) });
  }
  return links;
};