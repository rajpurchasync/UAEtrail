#!/usr/bin/env node
/** W87-W88 — SearchFeed wire port; list feed + FindCrew off fat Search. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const FEED =
  /resolveExploreSearchTripPool|resolveExploreSearchVenuePool|resolveExploreSearchJoinableTripCards|exploreSearchWhereBrowseQuery|exploreSearchComposeFeedMode|EXPLORE_SEARCH_MATCHES_TITLE|resolveExploreSearchDetectedWhereQuery/;
const ROUTING = /parseExploreSearchBrowseState|exploreSearchMapViewPathFromListSearch|exploreSearchResultsPath/;

const rewriteFeedModel = (content) => {
  if (!content.includes('useListDiscoveryExploreSearchFeedModel')) return content;
  if (!content.includes('discoveryPortExploreSearch')) return content;
  return content; // hand-maintained split
};

const walk = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      const rel = relative(root, full).replace(/\\/g, '/');
      if (rel.includes('discoveryPortExploreSearch.ts') || rel.includes('SearchFeed')) continue;
      const content = readFileSync(full, 'utf8');
      if (!FEED.test(content) && !ROUTING.test(content)) continue;
      if (!content.includes('discoveryPortExploreSearch')) continue;
      let next = content;
      if (FEED.test(content)) {
        next = next.replaceAll(
          "from '@/discovery/discoveryPortExploreSearch'",
          "from '@/discovery/discoveryPortExploreSearchFeed'"
        );
        next = next.replaceAll(
          "from '../../discovery/discoveryPortExploreSearch'",
          "from '../../discovery/discoveryPortExploreSearchFeed'"
        );
      }
      if (next !== content) {
        writeFileSync(full, next, 'utf8');
        console.log('updated', rel);
      }
    }
  }
};

walk(join(root, 'src/list'));
console.log('done — prefer manual split for useListDiscoveryExploreSearchFeedModel');