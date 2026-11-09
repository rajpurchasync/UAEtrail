import { useMemo, useState } from 'react';
import { Check, Link as LinkIcon, Mail, Share2, UserPlus } from 'lucide-react';
import { ACTIVITY_INVITE_FRIENDS_CTA } from '../../content/activityInviteCopy';
import {
  SHARE_SHEET_IN_APP_GENERIC_CTA,
  SHARE_SHEET_IN_APP_GENERIC_HINT,
  SHARE_SHEET_SECTION_EXTERNAL,
  SHARE_SHEET_SECTION_IN_APP,
} from '../../content/shareSheetCopy';
import { FacebookIcon } from '../icons/FacebookIcon';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';
import { buildShareText, buildShareUrl } from '../../utils/share';

export type ActivityOutingSharePayload = {
  title: string;
  text: string;
  path: string;
};

type ActivityOutingShareMenuBodyProps = {
  sharePayload: ActivityOutingSharePayload;
  onInviteOnApp?: () => void;
  showInviteOnApp?: boolean;
};

const rowButtonClass =
  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left active:bg-neutral-100';

const rowLinkClass =
  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-neutral-800 active:bg-neutral-100';

const iconWrapClass = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full';

/** Canonical outing share menu — in-app invite + external link channels (single sheet, no nested popover). */
export const ActivityOutingShareMenuBody = ({
  sharePayload,
  onInviteOnApp,
  showInviteOnApp = true,
}: ActivityOutingShareMenuBodyProps) => {
  const [copied, setCopied] = useState(false);

  const { url, shareLinks, canNativeShare } = useMemo(() => {
    const resolvedUrl =
      typeof window !== 'undefined' ? buildShareUrl(sharePayload.path) : buildShareUrl(sharePayload.path);
    const shareBody = buildShareText(sharePayload.title, sharePayload.text);
    const messageWithUrl = `${shareBody}\n${resolvedUrl}`;
    return {
      url: resolvedUrl,
      shareMessage: messageWithUrl,
      shareLinks: {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(messageWithUrl)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(resolvedUrl)}`,
        email: `mailto:?subject=${encodeURIComponent(sharePayload.title)}&body=${encodeURIComponent(messageWithUrl)}`,
      },
      canNativeShare: typeof navigator !== 'undefined' && 'share' in navigator,
    };
  }, [sharePayload.path, sharePayload.text, sharePayload.title]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: sharePayload.title,
        text: buildShareText(sharePayload.title, sharePayload.text),
        url,
      });
    } catch {
      // user dismissed
    }
  };

  const showActivityInvite = Boolean(showInviteOnApp && onInviteOnApp);

  const handleInAppShare = () => {
    if (showActivityInvite && onInviteOnApp) {
      onInviteOnApp();
      return;
    }
    if (canNativeShare) {
      void handleNativeShare();
      return;
    }
    void handleCopyLink();
  };

  return (
    <ul className="space-y-1 px-2 pb-safe-plus-2 pt-1">
      <li className="px-3 pt-1 pb-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">
          {SHARE_SHEET_SECTION_IN_APP}
        </p>
      </li>
      <li>
        <button type="button" className={rowButtonClass} onClick={handleInAppShare}>
          <span className={`${iconWrapClass} bg-emerald-50 text-emerald-700`} aria-hidden>
            <UserPlus className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-neutral-900">
              {showActivityInvite ? ACTIVITY_INVITE_FRIENDS_CTA : SHARE_SHEET_IN_APP_GENERIC_CTA}
            </span>
            <span className="block text-xs text-neutral-500">
              {showActivityInvite
                ? 'Invite buddies and groups on UAE Trail'
                : SHARE_SHEET_IN_APP_GENERIC_HINT}
            </span>
          </span>
        </button>
      </li>
      <li className="px-3 pt-2 pb-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">
          {SHARE_SHEET_SECTION_EXTERNAL}
        </p>
      </li>
      {canNativeShare ? (
        <li>
          <button type="button" className={rowButtonClass} onClick={() => void handleNativeShare()}>
            <span className={`${iconWrapClass} bg-neutral-100 text-emerald-700`} aria-hidden>
              <Share2 className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="text-sm font-semibold text-neutral-900">Share…</span>
          </button>
        </li>
      ) : null}
      <li>
        <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className={rowLinkClass}>
          <span className={`${iconWrapClass} bg-[#25D366]/10`} aria-hidden>
            <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
          </span>
          <span className="text-sm font-semibold text-neutral-900">WhatsApp</span>
        </a>
      </li>
      <li>
        <button type="button" className={rowButtonClass} onClick={() => void handleCopyLink()}>
          <span className={`${iconWrapClass} bg-neutral-100 text-neutral-600`} aria-hidden>
            {copied ? (
              <Check className="h-5 w-5 text-emerald-600" aria-hidden />
            ) : (
              <LinkIcon className="h-5 w-5" strokeWidth={2} aria-hidden />
            )}
          </span>
          <span className={`text-sm font-semibold ${copied ? 'text-emerald-700' : 'text-neutral-900'}`}>
            {copied ? 'Link copied!' : 'Copy link'}
          </span>
        </button>
      </li>
      <li>
        <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className={rowLinkClass}>
          <span className={`${iconWrapClass} bg-[#1877F2]/10`} aria-hidden>
            <FacebookIcon className="h-5 w-5 text-[#1877F2]" />
          </span>
          <span className="text-sm font-semibold text-neutral-900">Facebook</span>
        </a>
      </li>
      <li>
        <a href={shareLinks.email} className={rowLinkClass}>
          <span className={`${iconWrapClass} bg-neutral-100 text-neutral-600`} aria-hidden>
            <Mail className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="text-sm font-semibold text-neutral-900">Email</span>
        </a>
      </li>
    </ul>
  );
};
