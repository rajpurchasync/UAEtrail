#!/usr/bin/env node
/** W55 — retire discoveryPortExploreRuntime; URL wire → OptionalFilters + Routing. */
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const runtimePort = join(root, 'src/discovery/discoveryPortExploreRuntime.ts');

const OLD_IMPORT = `import {
  EXPLORE_FACILITY_KINDS_PARAM,
  EXPLORE_HAS_TRIP_PARAM,
  EXPLORE_PLACE_TYPES_PARAM,
  EXPLORE_PRICE_PARAM,
  EXPLORE_TRIP_TYPES_PARAM,
  parseExploreFacilityKinds,
  parseExploreHasTrip,
  parseExplorePriceFilter,
  parseMapFilter,
  parsePlaceMapTopicsParam,
  parseTripMapTopicsParam,
  parseVenueRegionsParam,
  serializeExploreFacilityKinds,
  serializeExploreHasTrip,
  serializeExplorePriceFilter,
  serializePlaceMapTopicsParam,
  serializeTripMapTopicsParam,
} from '../../discovery/discoveryPortExploreRuntime';
import { aliasListPlaceTopicToMap, aliasPlaceMapTopicToList } from '../../discovery/discoveryPortExploreOptionalFilters';`;

const NEW_IMPORT = `import { parseMapFilter, parseVenueRegionsParam } from '../../discovery/discoveryPortExploreRouting';
import {
  EXPLORE_FACILITY_KINDS_PARAM,
  EXPLORE_HAS_TRIP_PARAM,
  EXPLORE_PLACE_TYPES_PARAM,
  EXPLORE_PRICE_PARAM,
  EXPLORE_TRIP_TYPES_PARAM,
  aliasListPlaceTopicToMap,
  aliasPlaceMapTopicToList,
  parseExploreFacilityKinds,
  parseExploreHasTrip,
  parseExplorePriceFilter,
  parsePlaceMapTopicsParam,
  parseTripMapTopicsParam,
  serializeExploreFacilityKinds,
  serializeExploreHasTrip,
  serializeExplorePriceFilter,
  serializePlaceMapTopicsParam,
  serializeTripMapTopicsParam,
} from '../../discovery/discoveryPortExploreOptionalFilters';`;

if (existsSync(runtimePort)) {
  unlinkSync(runtimePort);
  console.log('deleted discoveryPortExploreRuntime.ts');
}

const walk = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      const rel = relative(root, full);
      if (rel.includes('consolidate-discovery-ports-w55')) continue;
      const content = readFileSync(full, 'utf8');
      const next = content.replace(OLD_IMPORT, NEW_IMPORT);
      if (next !== content) {
        writeFileSync(full, next, 'utf8');
        console.log('updated', rel);
      }
    }
  }
};

walk(join(root, 'src'));
console.log('done');