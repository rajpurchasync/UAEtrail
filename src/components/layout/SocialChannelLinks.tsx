import type { ComponentType } from 'react';
import { SOCIAL_EXTERNAL_LINK_PROPS, SOCIAL_LINKS } from '../../config/socialLinks';
import { FacebookIcon } from '../icons/FacebookIcon';
import { InstagramIcon } from '../icons/InstagramIcon';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';
import { YouTubeIcon } from '../icons/YouTubeIcon';

type SocialChannel = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
};

const SOCIAL_CHANNELS: SocialChannel[] = [
  {
    href: SOCIAL_LINKS.instagram,
    label: 'Follow UAE Trail on Instagram',
    icon: InstagramIcon,
    iconClassName: 'h-[1.35rem] w-[1.35rem] text-[#E4405F]',
  },
  {
    href: SOCIAL_LINKS.facebook,
    label: 'Follow UAE Trail on Facebook',
    icon: FacebookIcon,
    iconClassName: 'h-[1.35rem] w-[1.35rem] text-[#1877F2]',
  },
  {
    href: SOCIAL_LINKS.youtube,
    label: 'Subscribe to UAE Trail on YouTube',
    icon: YouTubeIcon,
    iconClassName: 'h-[1.35rem] w-[1.35rem]',
  },
  {
    href: SOCIAL_LINKS.whatsapp,
    label: 'Join the UAE Trail community on WhatsApp',
    icon: WhatsAppIcon,
    iconClassName: 'h-[1.35rem] w-[1.35rem] text-[#25D366]',
  },
];

const tileBaseClass =
  'flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-700/35 bg-gray-800/70 shadow-[inset_0_1px_0_rgba(52,211,153,0.1)] transition duration-200 hover:border-emerald-500/50 hover:bg-emerald-950/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400';

type SocialChannelLinksProps = {
  className?: string;
};

/** Official channel links — Footer and other dark surfaces. */
export const SocialChannelLinks = ({ className = '' }: SocialChannelLinksProps) => (
  <div className={['flex flex-col items-center gap-3', className].filter(Boolean).join(' ')}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-400/90">Follow us</p>
    <ul className="flex flex-wrap items-center justify-center gap-3" aria-label="UAE Trail on social media">
      {SOCIAL_CHANNELS.map((channel) => {
        const Icon = channel.icon;
        return (
          <li key={channel.href}>
            <a
              href={channel.href}
              {...SOCIAL_EXTERNAL_LINK_PROPS}
              className={tileBaseClass}
              aria-label={channel.label}
            >
              <Icon className={channel.iconClassName} />
            </a>
          </li>
        );
      })}
    </ul>
  </div>
);
