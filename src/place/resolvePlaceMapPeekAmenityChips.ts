import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import {
  resolvePlacePeekAudienceFromCard,
  resolvePlacePeekCampFactsFromCard,
  resolvePlacePeekTrailFactsFromCard,
} from './peek/resolvePlacePeekCatalogFacts';

/** Map venue peek — keep chips scannable; full fact grid lives on place detail. */
const CHIP_CAP = 2;

/** Amenity / kind chips for map venue peek (not the detail fact grid). */
export const resolvePlaceMapPeekAmenityChips = (card: DiscoveryCardModel): string[] => {
  const seen = new Set<string>();
  const chips: string[] = [];

  const push = (label: string) => {
    const key = label.trim().toLowerCase();
    if (!key || seen.has(key) || chips.length >= CHIP_CAP) return;
    seen.add(key);
    chips.push(label.trim());
  };

  for (const label of card.venueAmenityLabels ?? []) {
    push(label);
  }

  if (card.kind === 'hiking') {
    const facts = resolvePlacePeekTrailFactsFromCard(card);
    if (facts.difficulty) push(facts.difficulty);
    if (facts.elevationM) push(facts.elevationM);
    if (facts.distanceKm && chips.length < CHIP_CAP) push(`${facts.distanceKm} trail`);
  } else if (card.kind === 'camping') {
    const facts = resolvePlacePeekCampFactsFromCard(card);
    if (facts.surface) push(facts.surface);
    if (facts.campingStyle) push(facts.campingStyle);
  }

  for (const label of resolvePlacePeekAudienceFromCard(card)) {
    if (chips.length >= CHIP_CAP) break;
    push(label);
  }

  return chips;
};