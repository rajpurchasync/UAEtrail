/**
 * Public shell keeps meeting coordinates rounded (~1 km); exact pins live in `activity_private`.
 * @see docs/DOMAIN_CANONICALS.md §3.2.1
 */
export const roundMeetingCoordForShell = (value: number): number => Math.round(value * 100) / 100;

export const meetingPairForActivityShell = (
  meetingLat: number | null | undefined,
  meetingLng: number | null | undefined
): { meetingLat: number | null; meetingLng: number | null } => {
  if (
    meetingLat == null ||
    meetingLng == null ||
    Number.isNaN(meetingLat) ||
    Number.isNaN(meetingLng)
  ) {
    return { meetingLat: null, meetingLng: null };
  }
  return {
    meetingLat: roundMeetingCoordForShell(meetingLat),
    meetingLng: roundMeetingCoordForShell(meetingLng),
  };
};
