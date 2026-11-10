import {
  platformAlertsApi,
  sendReferralClickBeacon as sendReferralClickBeaconImpl,
} from '../api/domains/platformAlerts';

/** Public safety / ops banners for detail surfaces (`GET /alerts/active`). */
export const getActivePlatformAlerts = platformAlertsApi.getActivePlatformAlerts;

/** Fire-and-forget partner outbound click (see `POST /referrals/click`). */
export const sendReferralClickBeacon = sendReferralClickBeaconImpl;
