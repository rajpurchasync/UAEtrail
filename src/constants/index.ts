import { UAERegion } from '../types';

export const UAE_REGIONS: UAERegion[] = [
  'Dubai',
  'RAK',
  'Fujairah',
  'Abu Dhabi',
  'Al Ain',
  'Sharjah'
];

export const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
};

export const STATUS_COLORS = {
  free: 'bg-green-500',
  paid: 'bg-blue-500',
  full: 'bg-gray-400'
};

export const ADMIN_LINKS = [
  { to: '/admin/overview', label: 'Overview' },
  { to: '/admin/locations', label: 'Locations' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/organizers', label: 'Organizers' },
  { to: '/admin/events', label: 'Events' },
  { to: '/admin/shop', label: 'Shop' },
  { to: '/admin/audit-log', label: 'Audit Log' },
  { to: '/admin/settings', label: 'Notifications' }
];

export const HIKING_SUBCATEGORIES = [
  'Shoes',
  'Backpacks',
  'Clothing',
  'Accessories'
];

export const CAMPING_SUBCATEGORIES = [
  'Tents',
  'Chairs',
  'BBQ',
  'Accessories'
];
