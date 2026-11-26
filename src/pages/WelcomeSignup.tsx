import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { fetchMeProfile } from '../hooks/memberProfileApi';
import { SignupProfileWizard } from '../components/signup/SignupProfileWizard';
import { PageMeta } from '../components/seo/PageMeta';

import { isSignupProfileComplete } from '../constants/userProfileOptions';
import type { UserCountryCode, UserGender } from '../constants/userProfileOptions';
import { PRODUCT_SIGNUP_FINISH_TITLE } from '../content/productNorthStar';
import {
  EXPLORE_WELCOME_FINISH_STATE,
  resolveWelcomeFinishExplorePath,
} from '@/discovery/discoverySessionExploreWelcomeNavigation';
import { persistAuthReturnContextForPath } from '../utils/authPostLoginNavigation';

type WelcomeLocationState = {
  redirectTo?: string;
};

export const WelcomeSignup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as WelcomeLocationState | null) ?? {};
  const finishExplorePath = resolveWelcomeFinishExplorePath(state.redirectTo);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [profileDraft, setProfileDraft] = useState<{
    dateOfBirth?: string | null;
    gender?: UserGender | null;
    countryCode?: UserCountryCode | null;
    languages?: string | null;
  } | null>(null);

  const goToMap = () => {
    persistAuthReturnContextForPath(finishExplorePath);
    navigate(finishExplorePath, { replace: true, state: EXPLORE_WELCOME_FINISH_STATE });
  };

  useEffect(() => {
    void fetchMeProfile()
      .then((profile) => {
        if (isSignupProfileComplete(profile)) {
          persistAuthReturnContextForPath(finishExplorePath);
          navigate(finishExplorePath, { replace: true, state: EXPLORE_WELCOME_FINISH_STATE });
          return;
        }
        setProfileDraft(profile);
      })
      .catch(() => undefined)
      .finally(() => setLoadingProfile(false));
  }, [finishExplorePath, navigate]);

  if (loadingProfile) {
    return (
      <div className="app-page-center bg-ios-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="app-page-min-h app-scroll-body bg-ios-bg flex flex-col justify-center px-6 py-10 safe-area-top safe-area-bottom">
      <PageMeta title="Finish signing up" noIndex />
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-5">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-[14px] flex items-center justify-center shadow-sm">
              <Mountain className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">{PRODUCT_SIGNUP_FINISH_TITLE}</h1>
        </div>

        {profileDraft ? (
          <SignupProfileWizard initialProfile={profileDraft} onComplete={goToMap} />
        ) : null}
      </div>
    </div>
  );
};
