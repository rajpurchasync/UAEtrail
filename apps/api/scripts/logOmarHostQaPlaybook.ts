/** Console QA matrix for Omar (individual host) — log after `npm run seed` in dev. */
export const logOmarHostQaPlaybook = (): void => {
  console.log(
    [
      '',
      'Omar host QA (host@uaetrails.app / demo password from seed):',
      '  • New draft — Trips → Hosted → draft outing (seed-event-omar-draft) — manage, publish, no map peek crew until published',
      '  • Pending join — visitor@ pending on Fossil Rock Camp — host /host/requests + DM thread on map peek as visitor',
      '  • Approved join — visitor@ on Jebel Jais (agency) — participant peek: Message host, Ask crew, View details',
      '  • Hosted + roster — Desert Sunset Meetup with participant — Trips manage → Message crew, check-in on detail/manage',
      '  • Published “looking for” — demand pins on map (not host-owned); Omar hosts supply pins separately',
      '  • Notifications — visitor@: join approved + follow alerts; invite crew after you are approved (activity detail / peek)',
      '  • Friends — visitor@ Social → Friends; Followed → People (Omar, Khalid) | Places | Outings (wishlist saves)',
      '  • Withdraw — approved participants: “Withdraw request” + comment on activity detail; pending: “Cancel request”',
      '  • Join invite notification → /activity/:id?invite=1 (join modal + banner)',
      '  • Back — mobile header uses browser history (previous screen), not a hard-coded hub',
      '',
    ].join('\n')
  );
};
