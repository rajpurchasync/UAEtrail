import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { api } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { invalidateNotificationUnreadBadge } from '../../utils/notificationBadge';

interface ReviewPrompt {
  id: string;
  locationName: string;
  reviewPath: string;
}

export function ReviewPromptBanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [prompts, setPrompts] = useState<ReviewPrompt[]>([]);

  useEffect(() => {
    if (!user) return;
    api
      .getMeNotifications(1)
      .then((res) => {
        const unread = res.data.filter(
          (n) => !n.isRead && n.type === 'review_prompt' && n.meta && typeof n.meta === 'object'
        );
        setPrompts(
          unread.map((n) => {
            const meta = n.meta as { reviewPath?: string; locationId?: string };
            return {
              id: n.id,
              locationName: n.body.replace('Share your experience at ', '').replace(' to help fellow hikers.', ''),
              reviewPath: meta.reviewPath ?? '/discovery'
            };
          })
        );
      })
      .catch(() => {});
  }, [user]);

  if (prompts.length === 0) return null;

  const prompt = prompts[0];

  const dismiss = async () => {
    await api.markNotificationRead(prompt.id).catch(() => {});
    setPrompts((prev) => prev.filter((p) => p.id !== prompt.id));
    if (user?.id) {
      void invalidateNotificationUnreadBadge(queryClient, user.id);
    }
  };

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-start gap-3 flex-1">
        <Star className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-amber-900 text-sm">How was your trip?</p>
          <p className="text-sm text-amber-800 mt-0.5">
            Leave a review for {prompt.locationName} to help the community.
          </p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Link
          to={`${prompt.reviewPath}#reviews`}
          onClick={() => void dismiss()}
          className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700"
        >
          Write review
        </Link>
        <button
          type="button"
          onClick={() => void dismiss()}
          className="px-4 py-2 text-sm text-amber-800 hover:bg-amber-100 rounded-lg"
        >
          Later
        </button>
      </div>
    </div>
  );
}
