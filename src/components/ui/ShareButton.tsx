import { useState } from 'react';
import { Share2, Facebook, Link as LinkIcon, Mail, Check } from 'lucide-react';
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
  className?: string;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const ShareButton = ({
  title,
  text,
  path,
  compact = false,
  iconOnly = false,
  light = false,
  className = '',
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
    if (!showShareMenu && (compact || iconOnly) && canNativeShare) {
      const shared = await handleNativeShare();
      if (shared) return;
    }
    setShowShareMenu((open) => !open);
  };

  const buttonClass = iconOnly
    ? light
      ? 'inline-flex items-center justify-center w-8 h-8 rounded-full bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-200/90 hover:bg-neutral-50 transition-colors'
      : 'inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/35 backdrop-blur-sm text-white hover:bg-black/50 transition-colors'
    : compact
      ? 'inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/55 transition-colors'
      : 'inline-flex items-center gap-2 px-3.5 py-2 rounded-full glass text-neutral-800 text-sm font-semibold hover:bg-white/90 transition-colors';

  return (
    <div className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={(e) => void openMenu(e)} className={buttonClass} aria-label="Share">
        <Share2 className={iconOnly ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
        {!compact && !iconOnly && 'Share'}
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
                <Facebook className="w-5 h-5 text-[#1877F2] shrink-0" />
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
