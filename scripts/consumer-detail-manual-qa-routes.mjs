#!/usr/bin/env node
/**
 * Prints consumer-detail-surfaces plan §8 routes for manual QA.
 * Set BASE_URL (default http://localhost:5173). Replace :id/:slug/:userId from staging seed.
 * @see docs/experiment/consumer-detail-surfaces-plan.md §8
 */
const base = (process.env.BASE_URL || 'http://localhost:5173').replace(/\/$/, '');

/** @type {Array<{ surface: string; path: string; note?: string }>} */
const ROUTES = [
  { surface: 'Explore', path: '/explore' },
  { surface: 'Plan', path: '/plan' },
  { surface: 'Chat', path: '/chat' },
  { surface: 'Activity (hike)', path: '/activity/:id', note: '4 tabs, join/footer' },
  { surface: 'Activity (rideshare)', path: '/activity/:id', note: 'Transport tab emphasis' },
  { surface: 'Place trail', path: '/trail/:id' },
  { surface: 'Place camp', path: '/camp/:id' },
  { surface: 'Area hub', path: '/area/hatta', note: 'or any published area slug' },
  { surface: 'Member', path: '/member/:userId' },
  { surface: 'Shop', path: '/shop/:id' },
  { surface: 'Agency/guide', path: '/guide/:slug', note: 'or /agency/:slug, /partner/:slug' },
  { surface: 'Notifications', path: '/notifications' },
  { surface: 'Badges', path: '/profile/badges' },
  { surface: 'My Map', path: '/profile/history/map' },
  { surface: 'Settings', path: '/profile/settings' },
  { surface: 'Landing (guest)', path: '/', note: 'signed-in should redirect to /explore' },
];

console.log(`# Consumer detail §8 manual QA — BASE_URL=${base}\n`);
for (const { surface, path, note } of ROUTES) {
  const url = `${base}${path}`;
  const suffix = note ? `  # ${note}` : '';
  console.log(`${surface.padEnd(22)} ${url}${suffix}`);
}
console.log('\nAuth: sign-in → return URL or /explore (see plan §8).');
