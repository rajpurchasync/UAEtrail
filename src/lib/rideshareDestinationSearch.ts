export type RideshareDestinationSearchRow = {
  kind: 'activity_meeting' | 'catalog_place' | 'pending_place';
  id: string;
  mainText: string;
  secondaryText: string;
  lat: number;
  lng: number;
  activityType?: string;
  pendingApproval?: boolean;
  placeName?: string;
};

export const searchRideshareDestinations = async (
  query: string,
  signal?: AbortSignal
): Promise<RideshareDestinationSearchRow[]> => {
  const q = query.trim();
  if (q.length < 2) return [];
  const response = await fetch(`/api/geo/rideshare-destinations?q=${encodeURIComponent(q)}`, {
    signal,
  });
  if (!response.ok) {
    throw new Error('Destination search failed');
  }
  const payload = (await response.json()) as { data?: RideshareDestinationSearchRow[] };
  if (!Array.isArray(payload.data)) {
    throw new Error('Destination search failed');
  }
  return payload.data;
};
