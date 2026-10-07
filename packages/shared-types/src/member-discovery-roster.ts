/** Member shown on a published activity (Discover segment — not buddy graph). */
export type MemberDiscoveryOnTripRowDTO = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  activityId: string;
  activityTitle: string;
};

export type MemberDiscoveryRosterDTO = {
  onTrips: MemberDiscoveryOnTripRowDTO[];
};
