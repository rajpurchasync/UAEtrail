import type { HostStatusDTO } from '@uaetrail/shared-types';
import { resolvePaidMembershipSku } from '@uaetrail/shared-types';

/** Dev/staging until Stripe consumer Pro ships — set `UAETRAIL_CONSUMER_PRO_DEV=1`. */
export const consumerProDevEnabled = (): boolean => process.env.UAETRAIL_CONSUMER_PRO_DEV === '1';

export const isConsumerProMember = (hostStatus: HostStatusDTO | null): boolean => {
  if (resolvePaidMembershipSku(hostStatus) === 'consumer_pro') return true;
  if (consumerProDevEnabled() && hostStatus?.signupProfileComplete) return true;
  return false;
};
