import type { AuthUser } from '@uaetrail/shared-types';

export const isOrganizer = (role?: string) =>
  role === 'tenant_owner' || role === 'tenant_admin' || role === 'tenant_guide';

export const emptyForm = {
  locationId: '',
  title: '',
  description: '',
  date: '',
  time: '',
  endDate: '',
  endTime: '',
  capacity: 10,
  price: 0,
  meetingPoint: '',
  meetingLat: '',
  meetingLng: '',
  paymentTerms: '',
  itinerary: '',
  requirements: '',
  images: [] as string[],
  hostUserId: '',
};

export type PageTab = 'explore' | 'mine' | 'organized';

export const parseTabParam = (
  value: string | null,
  user: AuthUser | null,
  showOrganized: boolean
): PageTab => {
  if ((value === 'mine' || value === 'joined') && user) return 'mine';
  if (value === 'organized' && showOrganized) return 'organized';
  return 'explore';
};
