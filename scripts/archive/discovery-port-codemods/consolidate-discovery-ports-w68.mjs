#!/usr/bin/env node
/**
 * W68 — export useBrowseGeoScopeHydration on BrowseHooks for session (not GeoHub shell).
 * FeedActions + BrowseHooks must stay off Feed — session loading Feed footers causes nav cycle.
 */
console.log('W68 applied in-repo; re-run only after regression');