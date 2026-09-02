import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mountain, Users, MapPin, UserPlus, Share2 } from 'lucide-react';
import { api } from '../api/services';
import { PageMeta } from '../components/seo/PageMeta';

type WelcomeLocationState = {
  redirectTo?: string;
};

export const WelcomeSignup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as WelcomeLocationState | null) ?? {};
  const redirectTo = state.redirectTo ?? '/';
  const [step, setStep] = useState<1 | 2>(1);
  const [sharing, setSharing] = useState(false);

  const finish = () => {
    navigate(redirectTo, { replace: true });
  };

  const handleInviteFriend = async () => {
    setSharing(true);
    try {
      const res = await api.getMyRewards();
      const referralCode = res.data.referralCode;
      const inviteUrl = referralCode
        ? `${window.location.origin}/signup?ref=${referralCode}`
        : `${window.location.origin}/signup`;
      const shareText = 'Join me on UAE Trail — discover hikes, camps, and outdoor adventures across the Emirates.';

      if (navigator.share) {
        await navigator.share({ title: 'Join UAE Trail', text: shareText, url: inviteUrl });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${inviteUrl}`);
      }
      finish();
    } catch {
      navigate('/trail-points', { replace: true });
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-ios-bg flex flex-col justify-center px-6 py-10 safe-area-top safe-area-bottom">
      <PageMeta title="Welcome" noIndex />
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-5">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-[14px] flex items-center justify-center shadow-sm">
              <Mountain className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="text-[28px] font-bold text-neutral-900 tracking-tight">Welcome!</h1>
          <p className="text-[15px] text-neutral-500 mt-2">
            You&apos;re successfully registered with UAE Trail.
          </p>
        </div>

        {step === 1 ? (
          <div className="bg-white rounded-[20px] shadow-ios p-6">
            <p className="text-sm font-semibold text-neutral-900 mb-4">What would you like to do first?</p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate('/become-host', { replace: true })}
                className="w-full flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 text-left hover:bg-emerald-100/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Become a Host</p>
                  <p className="text-xs text-neutral-500">Lead hikes, camps, and meetups</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => navigate('/activities', { replace: true })}
                className="w-full flex items-center gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3.5 text-left hover:bg-neutral-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Join a Trip</p>
                  <p className="text-xs text-neutral-500">Browse upcoming adventures</p>
                </div>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full mt-5 text-sm text-neutral-400 hover:text-neutral-600"
            >
              Skip
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-[20px] shadow-ios p-6">
            <p className="text-sm font-semibold text-neutral-900 mb-4">Bring your crew along</p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => void handleInviteFriend()}
                disabled={sharing}
                className="w-full flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3.5 text-left hover:bg-sky-100/80 transition-colors disabled:opacity-60"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-sky-600">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Invite a Friend</p>
                  <p className="text-xs text-neutral-500">Share your invite link</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => navigate('/groups?create=1', { replace: true })}
                className="w-full flex items-center gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3.5 text-left hover:bg-neutral-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Create a Group</p>
                  <p className="text-xs text-neutral-500">Family or friends chat & trips</p>
                </div>
              </button>
            </div>
            <button
              type="button"
              onClick={finish}
              className="w-full mt-5 text-sm text-neutral-400 hover:text-neutral-600"
            >
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
