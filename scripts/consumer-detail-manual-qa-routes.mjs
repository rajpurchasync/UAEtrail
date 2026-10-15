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
  {
    surface: 'Activity (guest)',
    path: '/activity/:id',
    note: 'signed out — same shell; Plan gate; no crew/meeting bleed',
  },
  {
    surface: 'Activity (signed-in)',
    path: '/activity/:id',
    note: 'join-required hint vs full crew (chat, meeting map)',
  },
  { surface: 'Activity (hike)', path: '/activity/:id', note: 'kind facts grid + marketing fold' },
  { surface: 'Activity (rideshare)', path: '/activity/:id', note: 'Transport tab emphasis' },
  { surface: 'Place trail', path: '/trail/:id' },
  { surface: 'Place camp', path: '/camp/:id' },
  { surface: 'Area hub', path: '/area/hatta?tab=overview', note: 'tabs: overview | places | activities' },
  { surface: 'Member (guest)', path: '/member/:userId', note: 'ExploreGuestSignInCard intent=member-profile' },
  {
    surface: 'Member (public card)',
    path: '/member/:userId',
    note: 'signed in — stats only; no bio/upcoming until trusted',
  },
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

/** S10f / C9 — spot-check notification deep links (private actor labels are API-side). */
const NOTIFICATION_EDGE = [
  {
    case: 'Group wall (group_message)',
    steps: 'Post in a group wall → recipient taps bell → lands in /messages group thread',
  },
  {
    case: 'Buddy request (connection_buddy_request)',
    steps: 'Send buddy request → recipient notification → /buddies or profile path',
  },
  {
    case: 'Join approved + group chat (join_request_approved)',
    steps: 'Host approves joiner → notification opens activity or group thread when meta has groupId',
  },
  {
    case: 'Entity follow publish (entity_activity_published)',
    steps: 'Follow a place/shop → host publishes outing there → follower notification → activity detail',
  },
  {
    case: 'Private actor label',
    steps: 'Actor with private profile → group_message / publish fan-out shows generic actor copy, not PII',
  },
];

console.log('\n# S10f notification edge cases (manual — see HOST_CLEANUP_ROADMAP notification matrix)\n');
for (const { case: title, steps } of NOTIFICATION_EDGE) {
  console.log(`- ${title}`);
  console.log(`  ${steps}\n`);
}
console.log('Automated routing guards: src/utils/notificationRouting.test.ts, notificationConsumerGuard.test.ts');
