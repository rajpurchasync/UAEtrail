import type { GeoRef } from './geo-hierarchy.js';

/** Pin shape used by counter deltas — string ids, product collections. */
export type GeoCountedPin =
  | {
      family: 'place';
      kind: 'trail' | 'camp_spot' | 'facility';
      facilityType?: string;
      geoRef: GeoRef;
      attachedTo?: Array<{ id: string }>;
      counted: boolean;
    }
  | {
      family: 'activity';
      type: string;
      geoRef: GeoRef;
      placeId?: string | null;
      counted: boolean;
    };

export type GeoDelta = Map<string, Record<string, number>>;

export const countersFor = (p: GeoCountedPin): Record<string, number> => {
  if (!p.counted) return {};
  if (p.family === 'place') {
    return p.kind === 'facility' && p.facilityType
      ? { 'facilities.total': 1, [`facilities.${p.facilityType}`]: 1 }
      : { 'places.total': 1, [`places.${p.kind}`]: 1 };
  }
  const typeKey = p.type || 'event';
  return { 'activeActivities.total': 1, [`activeActivities.${typeKey}`]: 1 };
};

export const scopesFor = (p: GeoCountedPin): string[] => {
  const ids = [...p.geoRef.chain];
  if (p.family === 'place') {
    p.attachedTo?.forEach((a) => ids.push(a.id));
  } else if (p.placeId) {
    ids.push(p.placeId);
  }
  return [...new Set(ids.filter(Boolean))];
};

const contribution = (p: GeoCountedPin | null): GeoDelta => {
  const out: GeoDelta = new Map();
  if (!p) return out;
  const c = countersFor(p);
  if (Object.keys(c).length === 0) return out;
  for (const s of scopesFor(p)) out.set(s, { ...c });
  return out;
};

export const deltaFor = (
  before: GeoCountedPin | null,
  after: GeoCountedPin | null
): GeoDelta => {
  const a = contribution(after);
  const b = contribution(before);
  const out: GeoDelta = new Map();
  for (const scope of new Set([...a.keys(), ...b.keys()])) {
    const inc: Record<string, number> = {};
    for (const [k, v] of Object.entries(a.get(scope) ?? {})) inc[k] = (inc[k] ?? 0) + v;
    for (const [k, v] of Object.entries(b.get(scope) ?? {})) inc[k] = (inc[k] ?? 0) - v;
    for (const k of Object.keys(inc)) if (inc[k] === 0) delete inc[k];
    if (Object.keys(inc).length) out.set(scope, inc);
  }
  return out;
};
