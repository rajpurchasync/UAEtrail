import { Mountain, Facebook, Instagram, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FEATURE_FLAGS } from '../../config/platform';

const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/profile.php?id=61593777959562',
  instagram: 'https://www.instagram.com/uae.trail',
  whatsapp: 'https://chat.whatsapp.com/GhTp7ISAn2fCVE0LHb1fvU?s=cl&p=a&ilr=1',
  website: 'https://www.uaetrail.com',
} as const;

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const externalLinkProps = {
  target: '_blank' as const,
  rel: 'noopener noreferrer',
};

const footerLinkClass =
  'hover:text-emerald-500 transition-colors text-[10px] leading-tight sm:text-xs md:text-base md:leading-normal';

export const Footer = () => {
  const { user } = useAuth();
  return (
    <footer className="bg-gray-900 text-gray-300 pb-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col gap-6 md:grid md:grid-cols-4 md:gap-8">
          {/* Section 1 — brand */}
          <div>
            <div className="flex items-center space-x-2 mb-3 md:mb-4">
              <Mountain className="w-7 h-7 md:w-8 md:h-8 text-emerald-500 shrink-0" />
              <span className="text-lg md:text-xl font-bold text-white">UAE Trail</span>
            </div>
            <p className="text-[11px] sm:text-xs md:text-sm leading-relaxed">
              Discover the beauty of UAE&apos;s mountains and deserts through guided hiking and camping experiences.
            </p>
          </div>

          {/* Section 2 — menus (side-by-side on mobile) */}
          <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:gap-x-5 md:contents">
            <div>
              <h3 className="text-white font-semibold mb-2 md:mb-4 text-[11px] sm:text-xs md:text-base">
                Quick Links
              </h3>
              <ul className="space-y-1 md:space-y-2">
                <li>
                  <Link to="/discovery" className={footerLinkClass}>
                    Trails & Camps
                  </Link>
                </li>
                <li>
                  <Link to="/trips" className={footerLinkClass}>
                    Trips
                  </Link>
                </li>
                <li>
                  <Link to="/shop" className={footerLinkClass}>
                    Gear Shop
                  </Link>
                </li>
                <li>
                  <Link to="/trail-points" className={footerLinkClass}>
                    Trail Points
                  </Link>
                </li>
                {FEATURE_FLAGS.membershipEnabled && (
                  <li>
                    <Link to="/membership" className={footerLinkClass}>
                      Membership
                    </Link>
                  </li>
                )}
                <li>
                  <Link
                    to={user ? '/become-host' : '/signin?redirect=/become-host'}
                    className={footerLinkClass}
                  >
                    Become a Host
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2 md:mb-4 text-[11px] sm:text-xs md:text-base">About</h3>
              <ul className="space-y-1 md:space-y-2">
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
                <li>
                  <Link to="/faq" className={footerLinkClass}>
                    Safety & prep
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className={footerLinkClass}>
                    Terms
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className={footerLinkClass}>
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2 md:mb-4 text-[11px] sm:text-xs md:text-base">
                Follow Us
              </h3>
              <div className="flex flex-wrap gap-3 md:gap-4">
                <a
                  href={SOCIAL_LINKS.facebook}
                  {...externalLinkProps}
                  className="hover:text-emerald-500 transition-colors"
                  aria-label="UAE Trail on Facebook"
                >
                  <Facebook className="w-5 h-5 md:w-6 md:h-6" />
                </a>
                <a
                  href={SOCIAL_LINKS.instagram}
                  {...externalLinkProps}
                  className="hover:text-emerald-500 transition-colors"
                  aria-label="UAE Trail on Instagram"
                >
                  <Instagram className="w-5 h-5 md:w-6 md:h-6" />
                </a>
                <a
                  href={SOCIAL_LINKS.whatsapp}
                  {...externalLinkProps}
                  className="hover:text-emerald-500 transition-colors"
                  aria-label="UAE Trail on WhatsApp"
                >
                  <WhatsAppIcon className="w-5 h-5 md:w-6 md:h-6" />
                </a>
                <a
                  href={SOCIAL_LINKS.website}
                  {...externalLinkProps}
                  className="hover:text-emerald-500 transition-colors"
                  aria-label="UAE Trail website"
                >
                  <Globe className="w-5 h-5 md:w-6 md:h-6" />
                </a>
              </div>
              <p className="text-[10px] sm:text-xs md:text-sm mt-2 md:mt-3 leading-snug">
                <a href={SOCIAL_LINKS.website} {...externalLinkProps} className="hover:text-emerald-500 transition-colors">
                  www.uaetrail.com
                </a>
              </p>
              <p className="text-[10px] sm:text-xs md:text-sm mt-2 md:mt-4 leading-snug">
                Always prioritize safety. Check weather and inform someone before heading out.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 md:mt-8 pt-6 md:pt-8 text-[10px] sm:text-xs md:text-sm text-center">
          <p>&copy; 2026 UAE Trail. All rights reserved.</p>
          <a href="/llms.txt" className="hover:text-emerald-500 transition-colors text-[10px] mt-2 inline-block">
            AI / LLM site guide
          </a>
        </div>
      </div>
    </footer>
  );
};
