/** Public routes for the HTML site map and `public/sitemap.xml` (SEO). */

import { EXPLORE_MAP_PATH } from '../config/routingCatalog';

export type SiteMapEntry = {
  path: string;
  label: string;
  description: string;
};

export const PUBLIC_SITE_MAP: SiteMapEntry[] = [
  {
    path: '/',
    label: 'Home',
    description: 'Find your outdoor crew — hikes, camps, and group plans in the UAE.'
  },
  {
    path: EXPLORE_MAP_PATH,
    label: 'Explore map',
    description: 'Browse live activities, places, and outdoor plans on the map.'
  },
  {
    path: '/activities',
    label: 'Activities',
    description: 'Upcoming hikes, camps, and group outings you can join.'
  },
  {
    path: '/shop',
    label: 'Gear shops',
    description: 'Outdoor gear and shop contacts across the UAE.'
  },
  {
    path: '/about',
    label: 'About',
    description: 'Who we are and why we built UAE Trail.'
  },
  {
    path: '/faq',
    label: 'FAQ',
    description: 'Common questions about joining, hosting, and safety.'
  },
  {
    path: '/contact',
    label: 'Contact us',
    description: 'Reach support for account, activity, or safety questions.'
  },
  {
    path: '/terms',
    label: 'Terms and conditions',
    description: 'Terms of use for the platform.'
  },
  {
    path: '/privacy',
    label: 'Privacy policy',
    description: 'How we handle your data.'
  }
];
