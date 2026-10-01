import { Link } from 'react-router-dom';
import type { RewardBadgeDTO } from '@uaetrail/shared-types';
import { ShareButton } from '../ui/ShareButton';
import { Dialog } from '../ui/Dialog';
import { AppButton } from '../mobile/AppButton';
import { badgeShareFilename, renderBadgeSharePng } from '../../utils/badgeShareImage';
import { shareImageBlob } from '../../utils/shareImageFile';
import { resolveBadgeEarnAction } from '../../utils/badgeEarnRouting';
import { useState } from 'react';

type ProfileBadgeDetailDialogProps = {
  badge: RewardBadgeDTO | null;
  displayName: string;
  sharePath: string;
  onClose: () => void;
};

export const ProfileBadgeDetailDialog = ({
  badge,
  displayName,
  sharePath,
  onClose,
}: ProfileBadgeDetailDialogProps) => {
  const [storyBusy, setStoryBusy] = useState(false);
  const [storyHint, setStoryHint] = useState<string | null>(null);

  if (!badge) return null;

  const earnAction = resolveBadgeEarnAction(badge);

  const shareStoryCard = async () => {
    setStoryBusy(true);
    setStoryHint(null);
    try {
      const blob = await renderBadgeSharePng({
        displayName,
        badgeName: badge.name,
        badgeDescription: badge.description,
        badgeEmoji: badge.emoji,
        sharePath,
      });
      const result = await shareImageBlob(blob, badgeShareFilename(badge.key), {
        title: `${displayName} earned ${badge.name} on UAE Trail`,
        text: `${badge.emoji} ${badge.name}`,
      });
      if (result === 'downloaded') {
        setStoryHint('Story image saved — post it to your feed.');
      }
    } catch {
      setStoryHint('Could not create share image. Try link share instead.');
    } finally {
      setStoryBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(badge)} onClose={onClose} title={badge.name} className="!max-w-sm">
      <div className="flex flex-col items-center text-center">
        <span
          className={`mb-3 flex h-28 w-28 items-center justify-center rounded-full text-5xl shadow-lg ring-4 ${
            badge.earned
              ? 'bg-gradient-to-b from-amber-50 to-white ring-amber-300'
              : 'bg-neutral-100 ring-neutral-200 grayscale'
          }`}
        >
          {badge.emoji}
        </span>
        <p className="text-lg font-bold text-neutral-900">{badge.name}</p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{badge.description}</p>
        {badge.earned && badge.earnedAt ? (
          <p className="mt-2 text-xs font-medium text-neutral-500">
            Earned {new Date(badge.earnedAt).toLocaleDateString()}
          </p>
        ) : null}

        <div className="mt-5 flex w-full flex-col gap-2">
          {badge.earned ? (
            <>
              <AppButton
                type="button"
                variant="primary"
                fullWidth
                disabled={storyBusy}
                onClick={() => void shareStoryCard()}
              >
                {storyBusy ? 'Preparing image…' : 'Share story image'}
              </AppButton>
              <ShareButton
                title={`${displayName} earned ${badge.name} on UAE Trail`}
                text={`${badge.emoji} ${badge.name} — ${badge.description}`}
                path={sharePath}
              />
              {storyHint ? (
                <p className="text-center text-xs font-medium text-neutral-500">{storyHint}</p>
              ) : null}
            </>
          ) : (
            <Link to={earnAction.to} className="ios-btn w-full text-center" onClick={onClose}>
              {earnAction.label}
            </Link>
          )}
          <AppButton type="button" variant="secondary" fullWidth onClick={onClose}>
            Close
          </AppButton>
        </div>
      </div>
    </Dialog>
  );
};
