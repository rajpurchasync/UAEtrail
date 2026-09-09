import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mountain, Users, MapPin, Plus, Share2 } from 'lucide-react';
import { api } from '../api/services';
import { PageMeta } from '../components/seo/PageMeta';
import { explorePath } from '../utils/exploreRouting';
import {
  USER_CITY_OPTIONS,
  USER_GENDER_OPTIONS,
  maxDateOfBirthForMember,
  type UserCity,
  type UserGender,
  isSignupProfileComplete,
} from '../constants/userProfileOptions';

type WelcomeLocationState = {
  redirectTo?: string;
};

type WelcomeStep = 'confirm' | 1 | 2;

export const WelcomeSignup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as WelcomeLocationState | null) ?? {};
  const redirectTo = state.redirectTo ?? '/';
  const [step, setStep] = useState<WelcomeStep>('confirm');
  const [sharing, setSharing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<UserGender | ''>('');
  const [city, setCity] = useState<UserCity | ''>('');

  useEffect(() => {
    void api
      .getMeProfile()
      .then((res) => {
        const profile = res.data;
        if (profile.dateOfBirth) setDateOfBirth(profile.dateOfBirth);
        if (profile.gender) setGender(profile.gender);
        if (profile.city) setCity(profile.city);
        if (isSignupProfileComplete(profile)) {
          setStep(1);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoadingProfile(false));
  }, []);

  const finish = () => {
    navigate(redirectTo, { replace: true });
  };

  const handleConfirmProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!dateOfBirth) {
      setError('Select your date of birth.');
      return;
    }
    if (!gender) {
      setError('Select how you identify.');
      return;
    }
    if (!city) {
      setError('Select your city.');
      return;
    }

    setSubmitting(true);
    try {
      await api.completeSignupProfile({ dateOfBirth, gender, city });
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your details — try again.');
    } finally {
      setSubmitting(false);
    }
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

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-ios-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
      </div>
    );
  }

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
          <h1 className="text-[28px] font-bold text-neutral-900 tracking-tight">
            {step === 'confirm' ? 'Confirm your profile' : 'Welcome!'}
          </h1>
          <p className="text-[15px] text-neutral-500 mt-2">
            {step === 'confirm'
              ? 'We use this to match you with trips — women-only groups, age limits, and your city.'
              : "You're in — welcome to UAE Trail!"}
          </p>
        </div>

        {step === 'confirm' ? (
          <form onSubmit={(event) => void handleConfirmProfile(event)} className="bg-white rounded-[20px] shadow-ios p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
              <input
                type="date"
                value={dateOfBirth}
                max={maxDateOfBirthForMember()}
                onChange={(event) => setDateOfBirth(event.target.value)}
                className="ios-input w-full text-[17px] border border-neutral-300 bg-white"
                required
              />
            </div>

            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Gender</p>
              <div className="grid grid-cols-1 gap-2">
                {USER_GENDER_OPTIONS.map((option) => {
                  const active = gender === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setGender(option.value)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                        active
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-800 hover:border-emerald-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">City</p>
              <div className="grid grid-cols-2 gap-2">
                {USER_CITY_OPTIONS.map((option) => {
                  const active = city === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCity(option.value)}
                      className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        active
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-800 hover:border-emerald-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="ios-btn w-full bg-emerald-600 text-white disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Continue'}
            </button>
          </form>
        ) : step === 1 ? (
          <div className="bg-white rounded-[20px] shadow-ios p-6">
            <p className="text-sm font-semibold text-neutral-900 mb-4">What would you like to do first?</p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate(explorePath({ compose: true }), { replace: true })}
                className="w-full flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 text-left hover:bg-emerald-100/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Host an event</p>
                  <p className="text-xs text-neutral-500">Add a hike, camp, event, or carpool</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => navigate(explorePath(), { replace: true })}
                className="w-full flex items-center gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3.5 text-left hover:bg-neutral-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Join a trip</p>
                  <p className="text-xs text-neutral-500">Explore trips on the map</p>
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
