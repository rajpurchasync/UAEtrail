import type { PublicActiveAlertsResponse } from '@uaetrail/shared-types';
import { API_BASE_URL, apiRequest } from '../client';

/** Public safety / ops banners + partner referral click intake (`user` router, base `/api`). */
export const platformAlertsApi = {
  getActivePlatformAlerts: (params: { lat: number; lng: number; radiusKm?: number; region?: string }) => {
    const q = new URLSearchParams();
    q.set('lat', String(params.lat));
    q.set('lng', String(params.lng));
    if (params.radiusKm != null) q.set('radiusKm', String(params.radiusKm));
    if (params.region?.trim()) q.set('region', params.region.trim());
    return apiRequest<PublicActiveAlertsResponse>(`/alerts/active?${q.toString()}`);
  },

  recordReferralClick: (body: {
    entityKind: 'facility';
    entityId: string;
    destinationUrl: string;
    source?: string;
  }) =>
    apiRequest<void>(`/referrals/click`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
} as const;

/**
 * Fire-and-forget referral click — prefers `sendBeacon` for outbound partner links.
 * Used from facility consumer detail when `partnerReferralUrl` is set.
 */
export const sendReferralClickBeacon = (body: {
  entityKind: 'facility';
  entityId: string;
  destinationUrl: string;
  source?: string;
}): void => {
  const payload = JSON.stringify({
    entityKind: body.entityKind,
    entityId: body.entityId,
    destinationUrl: body.destinationUrl,
    source: body.source ?? 'partner_link',
  });
  const url = `${API_BASE_URL}/referrals/click`;
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([payload], { type: 'application/json' });
    const ok = navigator.sendBeacon(url, blob);
    if (ok) return;
  }
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    credentials: 'include',
    keepalive: true,
  }).catch(() => {});
};
