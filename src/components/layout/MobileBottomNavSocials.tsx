import { Facebook, Instagram } from 'lucide-react';

import { WhatsAppIcon } from '../icons/WhatsAppIcon';
import { SOCIAL_EXTERNAL_LINK_PROPS, SOCIAL_LINKS } from '../../config/socialLinks';

const socialIconClass =
  'flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors active:bg-neutral-100 active:text-emerald-700';

/** Facebook · Instagram · WhatsApp — same URLs as site footer. */
export const MobileBottomNavSocials = () => (
  <div
    className="flex items-center justify-center gap-1 border-b border-neutral-200/70 px-3 py-1"
    aria-label="UAE Trail on social media"
  >
    <a
      href={SOCIAL_LINKS.facebook}
      {...SOCIAL_EXTERNAL_LINK_PROPS}
      className={socialIconClass}
      aria-label="UAE Trail on Facebook"
    >
      <Facebook className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
    </a>
    <a
      href={SOCIAL_LINKS.instagram}
      {...SOCIAL_EXTERNAL_LINK_PROPS}
      className={socialIconClass}
      aria-label="UAE Trail on Instagram"
    >
      <Instagram className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
    </a>
    <a
      href={SOCIAL_LINKS.whatsapp}
      {...SOCIAL_EXTERNAL_LINK_PROPS}
      className={socialIconClass}
      aria-label="UAE Trail on WhatsApp"
    >
      <WhatsAppIcon className="h-[18px] w-[18px]" />
    </a>
  </div>
);
