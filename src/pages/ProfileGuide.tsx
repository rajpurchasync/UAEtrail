import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isGuideProfileComplete } from '@uaetrail/shared-types';
import { fetchMeProfile, updateMeProfile } from '../hooks/memberProfileApi';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { AppButton } from '../components/mobile/AppButton';
import { SignupLanguagePicker } from '../components/signup/SignupLanguagePicker';
import { formatLanguages, parseLanguagesList } from '../utils/profileLanguages';
import { useProfileHubBackChrome } from '../hooks/useProfileHubBackChrome';
import { PROFILE_PATH } from '../config/routingCatalog';
import { PageMeta } from '../components/seo/PageMeta';
import { ProfileFormField } from '../components/profile/ProfileFormSection';
import { isSignupProfileComplete } from '../constants/userProfileOptions';
import { WELCOME_PATH } from '../config/surfacePaths';

export const ProfileGuide = () => {
  const backChrome = useProfileHubBackChrome();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect')?.trim() || PROFILE_PATH;
  const { refresh: refreshMemberStatus } = useMemberStatus();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [guideExperience, setGuideExperience] = useState('');

  useEffect(() => {
    void fetchMeProfile()
      .then((profile) => {
        if (!isSignupProfileComplete(profile)) {
          navigate(WELCOME_PATH, { replace: true });
          return;
        }
        if (isGuideProfileComplete(profile) || profile.guideProfileComplete) {
          navigate(redirectTo, { replace: true });
          return;
        }
        setBio(profile.bio?.trim() ?? '');
        setLanguages(parseLanguagesList(profile.languages));
        setGuideExperience(profile.guideExperience?.trim() ?? '');
      })
      .catch(() => setError('Could not load your profile.'))
      .finally(() => setLoading(false));
  }, [navigate, redirectTo]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const bioTrim = bio.trim();
    const experienceTrim = guideExperience.trim();
    const languagesWire = formatLanguages(languages);
    if (!bioTrim) {
      setError('Add a short bio so people know who you are on the trail.');
      return;
    }
    if (!languagesWire) {
      setError('Add at least one language you can host in.');
      return;
    }
    if (experienceTrim.length < 3) {
      setError('Share a bit about your outdoor experience (a few words is enough).');
      return;
    }
    setSaving(true);
    try {
      await updateMeProfile({
        bio: bioTrim,
        languages: languagesWire,
        guideExperience: experienceTrim,
      });
      await refreshMemberStatus();
      navigate(redirectTo, { replace: true });
    } catch {
      setError('Could not save your guide profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-page-center bg-ios-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <ConsumerShell
      title="Guide profile"
      back={{ fallbackTo: PROFILE_PATH, label: backChrome.label ?? 'Profile' }}
    >
      <PageMeta title="Guide profile" noIndex />
      <form onSubmit={onSubmit} className="px-4 pb-8 pt-2 space-y-5 max-w-lg mx-auto w-full">
        <p className="text-[15px] text-neutral-600 leading-relaxed">
          Tell people who you are when you host free outings or share guide availability on the map.
        </p>

        <ProfileFormField label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={400}
            className="ios-input text-[16px] min-h-[120px] resize-y"
            placeholder="What do you love getting outside for? How do you like to host?"
            required
          />
        </ProfileFormField>

        <ProfileFormField label="Languages">
          <SignupLanguagePicker value={languages} onChange={setLanguages} />
        </ProfileFormField>

        <ProfileFormField label="Outdoor experience">
          <textarea
            value={guideExperience}
            onChange={(e) => setGuideExperience(e.target.value)}
            rows={3}
            maxLength={500}
            className="ios-input text-[16px] min-h-[96px] resize-y"
            placeholder="e.g. Weekend hiker in the UAE for 3 years; led small groups at Wadi Shawka."
            required
          />
        </ProfileFormField>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <AppButton type="submit" disabled={saving} fullWidth>
          {saving ? 'Saving…' : 'Save guide profile'}
        </AppButton>
      </form>
    </ConsumerShell>
  );
};