import { isGeographyMapSource, type DiscoveryCardKind, type DiscoveryCardSource } from '@uaetrail/shared-types';
import type { PlaceMapPin } from '../components/ui/placesMapTypes';

const CLUSTER_TOOLTIP_BUCKET_ORDER = ['hike', 'camping', 'other'] as const;
type ClusterTooltipBucket = (typeof CLUSTER_TOOLTIP_BUCKET_ORDER)[number];

const CLUSTER_TOOLTIP_BUCKET_LABEL: Record<ClusterTooltipBucket, string> = {
  hike: 'Hike',
  camping: 'Camping',
  other: 'Other',
};

const clusterTooltipBucketForKind = (kind: DiscoveryCardKind): ClusterTooltipBucket => {
  if (kind === 'hiking') return 'hike';
  if (kind === 'camping') return 'camping';
  return 'other';
};

/** Cluster / stacked pin hover — e.g. `1-Hike, 2-Camping, 3-Other`. */
export const formatExploreMapClusterTooltipLabel = (
  entries: Array<{ kind: DiscoveryCardKind; stackCount?: number | null }>
): string | null => {
  if (entries.length === 0) return null;
  const totals: Record<ClusterTooltipBucket, number> = { hike: 0, camping: 0, other: 0 };
  for (const entry of entries) {
    const count = Math.max(0, entry.stackCount ?? 1);
    if (count === 0) continue;
    totals[clusterTooltipBucketForKind(entry.kind)] += count;
  }
  const parts: string[] = [];
  for (const bucket of CLUSTER_TOOLTIP_BUCKET_ORDER) {
    const count = totals[bucket];
    if (count > 0) parts.push(`${count}-${CLUSTER_TOOLTIP_BUCKET_LABEL[bucket]}`);
  }
  return parts.length > 0 ? parts.join(', ') : null;
};

const MAP_PIN_MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** Compact map hover date, e.g. `25Nov`. */
export const formatExploreMapPinDateShort = (iso?: string | null): string | null => {
  if (!iso?.trim()) return null;
  const target = new Date(`${iso.trim().slice(0, 10)}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const month = MAP_PIN_MONTH_SHORT[target.getMonth()];
  if (!month) return null;
  return `${target.getDate()}${month}`;
};

export const isScheduledActivityMapPin = (pin: {
  source?: DiscoveryCardSource;
  activityMode?: PlaceMapPin['activityMode'];
}): boolean => {
  if (pin.activityMode === 'hosted' || pin.activityMode === 'seeking') return true;
  const source = pin.source;
  if (!source) return false;
  if (source === 'availability') return true;
  if (source === 'activity') return true;
  if (isGeographyMapSource(source)) return false;
  if (source === 'shop' || source === 'agency' || source === 'destination') return false;
  return false;
};

export const formatExploreMapPinTooltipLabel = (pin: {
  name: string;
  scheduleDate?: string | null;
  source?: DiscoveryCardSource;
  activityMode?: PlaceMapPin['activityMode'];
}): string | null => {
  if (!isScheduledActivityMapPin(pin)) return null;
  const title = pin.name.trim();
  if (!title) return null;
  const shortTitle = title.length > 48 ? `${title.slice(0, 46)}…` : title;
  const date = formatExploreMapPinDateShort(pin.scheduleDate);
  return date ? `${shortTitle} · ${date}` : shortTitle;
};
