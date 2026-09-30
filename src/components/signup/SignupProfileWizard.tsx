import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/index';
import { useAuth } from '../../context/AuthContext';
import type { UserCountryCode, UserGender } from '../../constants/userProfileOptions';
import {
  PRODUCT_SIGNUP_LOCATION_HINT,
  PRODUCT_SIGNUP_STEP_DOB,
  PRODUCT_SIGNUP_STEP_GENDER,
  PRODUCT_SIGNUP_STEP_LOCATION,
} from '../../content/productNorthStar';
import {
  MemberDetailsEditFields,
  type MemberDetailsFormValue,
} from '../profile/MemberDetailsEditFields';
import { parseLanguagesList } from '../../utils/profileLanguages';
import {
  SIGNUP_PROFILE_STEPS,
  firstIncompleteSignupStep,
  signupProfileStepIndex,
  type SignupProfileStep,
} from '../../utils/signupProfileSteps';
import { meProfileSignupGateKey } from '../../utils/signupProfileGate';
import { SignupStepShell } from './SignupStepShell';

interface SignupProfileWizardProps {
  initialProfile: {
    dateOfBirth?: string | null;
    gender?: UserGender | null;
    countryCode?: UserCountryCode | null;
    city?: string | null;
    languages?: string | null;
  };
  onComplete: () => void;
}

const STEP_SHELL: Record<SignupProfileStep, { title: string; hint?: string }> = {
  dateOfBirth: { title: PRODUCT_SIGNUP_STEP_DOB },
  gender: { title: PRODUCT_SIGNUP_STEP_GENDER },
  countryCode: { title: PRODUCT_SIGNUP_STEP_LOCATION, hint: PRODUCT_SIGNUP_LOCATION_HINT },
};

const resolveInitialCountry = (profile: SignupProfileWizardProps['initialProfile']): UserCountryCode | '' => {
  if (profile.countryCode) return profile.countryCode;
  if (profile.city) return 'AE';
  return '';
};

export const SignupProfileWizard = ({ initialProfile, onComplete }: SignupProfileWizardProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [step, setStep] = useState<SignupProfileStep>(() => firstIncompleteSignupStep(initialProfile));
  const [form, setForm] = useState<MemberDetailsFormValue>(() => ({
    dateOfBirth: initialProfile.dateOfBirth ?? '',
    gender: initialProfile.gender ?? '',
    countryCode: resolveInitialCountry(initialProfile),
    languages: parseLanguagesList(initialProfile.languages),
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepNumber = signupProfileStepIndex(step) + 1;
  const shell = STEP_SHELL[step];

  const goNext = () => {
    const index = signupProfileStepIndex(step);
    if (index < SIGNUP_PROFILE_STEPS.length - 1) {
      setStep(SIGNUP_PROFILE_STEPS[index + 1]!);
      setError(null);
    }
  };

  const goBack = () => {
    const index = signupProfileStepIndex(step);
    if (index > 0) {
      setStep(SIGNUP_PROFILE_STEPS[index - 1]!);
      setError(null);
    }
  };

  const patchForm = (patch: Partial<MemberDetailsFormValue>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const continueDisabled = useMemo(() => {
    if (step === 'dateOfBirth') return !form.dateOfBirth;
    if (step === 'gender') return !form.gender;
    if (step === 'countryCode') return !form.countryCode;
    return false;
  }, [step, form.dateOfBirth, form.gender, form.countryCode, form.languages.length]);

  const handleContinue = async () => {
    setError(null);
    if (step === 'dateOfBirth' && !form.dateOfBirth) {
      setError('Select your date of birth.');
      return;
    }
    if (step === 'gender' && !form.gender) {
      setError('Select how you identify.');
      return;
    }
    if (step !== 'countryCode') {
      goNext();
      return;
    }

    if (!form.countryCode) {
      setError('Select where you are based.');
      return;
    }

    setSubmitting(true);
    try {
      await api.completeSignupProfile({
        dateOfBirth: form.dateOfBirth,
        gender: form.gender as UserGender,
        countryCode: form.countryCode,
      });
      if (user?.id) {
        await queryClient.invalidateQueries({ queryKey: meProfileSignupGateKey(user.id) });
      }
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save — try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        disabled={continueDisabled || submitting}
        onClick={() => void handleContinue()}
        className="ios-btn w-full bg-emerald-600 text-white disabled:opacity-60"
      >
        {submitting ? 'Saving…' : step === 'countryCode' ? 'Finish' : 'Continue'}
      </button>
    </>
  );

  return (
    <SignupStepShell
      stepNumber={stepNumber}
      title={shell.title}
      hint={step === 'countryCode' ? undefined : shell.hint}
      onBack={stepNumber > 1 ? goBack : undefined}
      footer={footer}
    >
      <MemberDetailsEditFields
        layout="step"
        step={step}
        value={form}
        onChange={patchForm}
        disabled={submitting}
      />
    </SignupStepShell>
  );
};
