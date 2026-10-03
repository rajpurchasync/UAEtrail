import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { SOCIAL_EXTERNAL_LINK_PROPS, SOCIAL_LINKS } from '../../config/socialLinks';
import { Facebook, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

import { WhatsAppIcon } from '../icons/WhatsAppIcon';

const footerLinkClass = 'hover:text-emerald-500 transition-colors text-xs sm:text-sm';

export const Footer = () => (
  <footer className="bg-gray-900 text-gray-300 pb-safe">
    <div className="md:hidden border-t border-gray-800 px-4 py-4">
      <div className="flex items-center justify-between gap-3 text-xs">
        <Link to={EXPLORE_MAP_PATH} className={footerLinkClass}>
          Map
        </Link>
        <Link to="/faq" className={footerLinkClass}>
          FAQ
        </Link>
        <a
          href={SOCIAL_LINKS.instagram}
          {...SOCIAL_EXTERNAL_LINK_PROPS}
          className={footerLinkClass}
          aria-label="Instagram"
        >
          Instagram
        </a>
        <a href="mailto:support@uaetrail.com" className={footerLinkClass}>
          Contact
        </a>
      </div>
      <p className="mt-3 text-center text-[11px] text-gray-500">&copy; 2026 UAE Trail</p>
    </div>

    <div className="hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:block md:py-10">
      <div className="grid grid-cols-3 gap-6 md:gap-10">
        <div>
          <h3 className="text-white font-semibold mb-3 text-xs sm:text-sm uppercase tracking-wide">Quick Links</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/" className={footerLinkClass}>
                Home
              </Link>
            </li>
            <li>
              <Link to={EXPLORE_MAP_PATH} className={footerLinkClass}>
                Map
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3 text-xs sm:text-sm uppercase tracking-wide">About</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/faq" className={footerLinkClass}>
                FAQ
              </Link>
            </li>
            <li>
              <a href="mailto:support@uaetrail.com" className={footerLinkClass}>
                Contact
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3 text-xs sm:text-sm uppercase tracking-wide">Socials</h3>
          <div className="flex flex-wrap gap-3">
            <a
              href={SOCIAL_LINKS.facebook}
              {...SOCIAL_EXTERNAL_LINK_PROPS}
              className="hover:text-emerald-500 transition-colors"
              aria-label="UAE Trail on Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href={SOCIAL_LINKS.instagram}
              {...SOCIAL_EXTERNAL_LINK_PROPS}
              className="hover:text-emerald-500 transition-colors"
              aria-label="UAE Trail on Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href={SOCIAL_LINKS.whatsapp}
              {...SOCIAL_EXTERNAL_LINK_PROPS}
              className="hover:text-emerald-500 transition-colors"
              aria-label="UAE Trail on WhatsApp"
            >
              <WhatsAppIcon className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 mt-8 pt-6 text-xs text-center text-gray-400">
        <p>&copy; 2026 UAE Trail. All rights reserved.</p>
      </div>
    </div>
  </footer>
);
