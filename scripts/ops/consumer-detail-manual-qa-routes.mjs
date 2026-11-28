#!/usr/bin/env node
/**
 * Prints consumer-detail-surfaces plan §8 routes for manual QA.
 * Set BASE_URL (default http://localhost:5173). Replace :id/:slug/:userId from staging seed.
 * @see consumerDetailQaMatrixGuard · docs/SYSTEM_COHERENCE.md S9/S10f
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
  {
    surface: 'Activity (seeking)',
    path: '/activity/:id',
    note:
      'activityMode seeking — archived find post; join disabled; availability CTA in notice (no demand: hop)',
  },
  { surface: 'Activity (rideshare)', path: '/activity/:id', note: 'Transport tab emphasis' },
  {
    surface: 'Activity (host approve)',
    path: '/activity/:id',
    note: 'host on Buddies tab — pending requests approve/decline (not /workspace/requests only)',
  },
  { surface: 'Place trail', path: '/trail/:id' },
  { surface: 'Place camp', path: '/camp/:id' },
  { surface: 'Destination hub', path: '/destination/hatta?tab=overview', note: 'tabs: overview | places | activities' },
  { surface: 'Member (guest)', path: '/member/:userId', note: 'ExploreGuestSignInCard intent=member-profile' },
  {
    surface: 'Member (public card)',
    path: '/member/:userId',
    note: 'signed in — stats only; no bio/upcoming until trusted',
  },
  { surface: 'Shop', path: '/shop/:id' },
  { surface: 'Agency', path: '/agency/:slug' },
  { surface: 'Partner', path: '/partner/:slug' },
  { surface: 'Notifications', path: '/settings/notifications' },
  { surface: 'Badges', path: '/profile/badges' },
  { surface: 'My Map', path: '/profile/history/map' },
  { surface: 'App settings', path: '/settings' },
  { surface: 'Landing (guest)', path: '/', note: 'signed-in should redirect to /explore' },
  {
    surface: 'Compose (Trips FAB)',
    path: '/explore?compose=activity',
    note: 'MIG compose — kind grid; emit activity|place|intent only',
  },
  {
    surface: 'Compose (intent open)',
    path: '/explore?compose=intent:open&list=1&peopleBrowse=1',
    note: 'mark availability — not planAdd or lens=availability',
  },
  {
    surface: 'Operator (workspace)',
    path: '/operator/overview',
    note: 'canAccessOperatorWorkspace; SPA /operator/* only',
  },
  {
    surface: 'Plan (hosting filter)',
    path: '/plan?tab=upcoming&filter=hosting',
    note: 'My Plans hosting projection — operator schedule separate',
  },
  {
    surface: 'My Crews',
    path: '/crews',
    note: 'Friends hub — canonical /crews',
  },
  {
    surface: 'Post-auth default',
    path: '/explore',
    note: 'tenant roles land Explore — operator via Profile Dashboard',
  },
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
    case: 'Friend request (connection_friend_request)',
    steps: 'Send friend request → recipient notification → /crews or profile path',
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

console.log('\n# S10f notification edge cases (manual — notificationRouting.test.ts)\n');
for (const { case: title, steps } of NOTIFICATION_EDGE) {
  console.log(`- ${title}`);
  console.log(`  ${steps}\n`);
}
console.log('Automated routing guards: src/utils/notificationRouting.test.ts, notificationConsumerGuard.test.ts');
