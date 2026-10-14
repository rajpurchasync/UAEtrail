import { useState } from 'react';
import { Share2, Send, Link as LinkIcon, Mail, Check } from 'lucide-react';
import { FacebookIcon } from '../icons/FacebookIcon';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';
import { buildShareText, buildShareUrl } from '../../utils/share';

interface ShareButtonProps {
  title: string;
  /** Short line included in WhatsApp / email / native share */
  text?: string;
  /** App path, e.g. `/activity/abc` — builds full URL for sharing from cards */
  path?: string;
  /** Icon-only overlay for heroes and cards */
  compact?: boolean;
  /** Smaller icon button for list rows */
  iconOnly?: boolean;
  /** Icon button on light card backgrounds (default is dark overlay for photos) */
  light?: boolean;
  /** Icon-only on photos — no circular background (list feed). */
  bare?: boolean;
  /** Instagram-style paper plane instead of share nodes. */
  icon?: 'share' | 'send';
  iconClassName?: string;
  disabled?: boolean;
  className?: string;
  /** Overrides default “Share” label on full button variant. */
  label?: string;
}

export const ShareButton = ({
  title,
  text,
  path,
  compact = false,
  iconOnly = false,
  light = false,
  bare = false,
  icon = 'share',
  iconClassName,
  disabled = false,
  className = '',
  label,
}: ShareButtonProps) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const url =
    path && typeof window !== 'undefined'
      ? buildShareUrl(path)
      : typeof window !== 'undefined'
        ? window.location.href
        : path
          ? buildShareUrl(path)
          : '';

  const shareBody = buildShareText(title, text);
  const shareMessage = `${shareBody}\n${url}`;

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareMessage)}`,
  };

  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const handleNativeShare = async () => {
    if (!canNativeShare) return false;
    try {
      await navigator.share({ title, text: shareBody, url });
      setShowShareMenu(false);
      return true;
    } catch {
      return false;
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowShareMenu(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const openMenu = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (!showShareMenu && (compact || iconOnly) && canNativeShare) {
      const shared = await handleNativeShare();
      if (shared) return;
    }
    setShowShareMenu((open) => !open);
  };

  const buttonClass = iconOnly
    ? bare
      ? 'inline-flex h-9 w-9 items-center justify-center text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)] transition-opacity hover:opacity-90'
      : light
        ? 'inline-flex items-center justify-center w-8 h-8 rounded-full bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-200/90 hover:bg-neutral-50 transition-colors'
        : 'inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/35 backdrop-blur-sm text-white hover:bg-black/50 transition-colors'
    : compact
      ? 'inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/55 transition-colors'
      : 'inline-flex items-center gap-2 px-3.5 py-2 rounded-full glass text-neutral-800 text-sm font-semibold hover:bg-white/90 transition-colors';

  return (
    <div className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => void openMenu(e)}
        className={`${buttonClass}${disabled ? ' opacity-50 pointer-events-none' : ''}`}
        aria-label="Share"
      >
        {icon === 'send' ? (
          <Send
            className={iconClassName ?? (iconOnly ? 'h-[1.35rem] w-[1.35rem]' : 'h-5 w-5')}
            strokeWidth={2}
            aria-hidden
          />
        ) : (
          <Share2 className={iconClassName ?? (iconOnly ? 'w-3.5 h-3.5' : 'w-5 h-5')} aria-hidden />
        )}
        {!compact && !iconOnly && (label ?? 'Share')}
      </button>

      {showShareMenu && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/30 md:bg-transparent" onClick={() => setShowShareMenu(false)} />
          <div
            className="fixed inset-x-0 bottom-0 z-[70] glass rounded-t-[24px] border-t border-white/60 p-4 pb-safe-plus-2 animate-fade-up md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-64 md:rounded-2xl md:border md:pb-4 md:shadow-xl"
            role="menu"
          >
            <p className="text-sm font-bold text-neutral-900 mb-3 px-1 md:hidden">Share with friends</p>
            <div className="space-y-0.5">
              {canNativeShare && (
                <button
                  type="button"
                  onClick={() => void handleNativeShare()}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-neutral-800 hover:bg-neutral-50/80 active:bg-neutral-100/80"
                >
                  <Share2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-[15px] font-medium">Share…</span>
                </button>
              )}
              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-neutral-800 hover:bg-neutral-50/80 active:bg-neutral-100/80"
                onClick={() => setShowShareMenu(false)}
              >
                <WhatsAppIcon className="w-5 h-5 text-[#25D366] shrink-0" />
                <span className="text-[15px] font-medium">WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => void handleCopyLink()}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-neutral-800 hover:bg-neutral-50/80 active:bg-neutral-100/80"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-[15px] font-medium text-emerald-700">Link copied!</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-5 h-5 text-neutral-500 shrink-0" />
                    <span className="text-[15px] font-medium">Copy link</span>
                  </>
                )}
              </button>
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-neutral-800 hover:bg-neutral-50/80 active:bg-neutral-100/80"
                onClick={() => setShowShareMenu(false)}
              >
                <FacebookIcon className="w-5 h-5 text-[#1877F2] shrink-0" />
                <span className="text-[15px] font-medium">Facebook</span>
              </a>
              <a
                href={shareLinks.email}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-neutral-800 hover:bg-neutral-50/80 active:bg-neutral-100/80"
                onClick={() => setShowShareMenu(false)}
              >
                <Mail className="w-5 h-5 text-neutral-500 shrink-0" />
                <span className="text-[15px] font-medium">Email</span>
              </a>
            </div>
            <button
              type="button"
              onClick={() => setShowShareMenu(false)}
              className="mt-3 w-full py-3 rounded-xl text-center text-sm font-semibold text-neutral-500 md:hidden"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};
