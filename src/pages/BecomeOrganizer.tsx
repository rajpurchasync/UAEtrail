import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CalendarPlus,
  CheckCircle,
  Clock,
  Globe2,
  HandHeart,
  Heart,
  Loader2,
  Mountain,
  Sparkles,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '../api/services';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { PAGE_BANNERS } from '../config/pageBanners';
import { PageMeta } from '../components/seo/PageMeta';
import { DEFAULT_PHONE_DIAL, PHONE_COUNTRIES } from '../constants/phoneCountries';
import { formatE164Phone, isValidNationalPhone } from '../utils/phone';
import { PhoneInput } from '../components/ui/PhoneInput';
import { ImageUpload } from '../components/ui/ImageUpload';
import { COUNTRIES } from '../constants';

const whyHostReasons = [
  {
    icon: Users,
    title: 'Make new friends',
    description:
      'Bring together people who love the outdoors. A shared summit, a campfire chat — hosting turns strangers into your trail family.',
    accent: 'bg-sky-50 text-sky-600',
  },
  {
    icon: HandHeart,
    title: 'Give back to the community',
    description:
      'Welcome beginners, share safety tips, and help more residents & visitors experience the UAE outdoors with confidence.',
    accent: 'bg-rose-50 text-rose-600',
  },
  {
    icon: Globe2,
    title: 'Promote the UAE',
    description:
      'From Fossil Rock to Jebel Jais — show the landscapes you love and inspire others to explore beyond the city.',
    accent: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Heart,
    title: 'Create real connections',
    description:
      'This is not just logistics. You are building memories — sunrise coffees, summit high-fives, and stories people retell for years.',
    accent: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Sparkles,
    title: 'Grow your reputation',
    description:
      'Earn reviews, build a following, and become a trusted voice in the outdoor community — one great trip at a time.',
    accent: 'bg-violet-50 text-violet-600',
  },
  {
    icon: Mountain,
    title: 'Host your way',
    description:
      'Solo guide or registered business. Free meetups or paid adventures. You choose the pace, places, and people you lead.',
    accent: 'bg-teal-50 text-teal-600',
  },
];

const howItWorks = [
  { step: '1', title: 'Share your story', desc: 'Tell us who you are and what kind of adventures you want to lead.' },
  { step: '2', title: 'Quick verification', desc: 'We review your profile to keep the community safe and trustworthy.' },
  { step: '3', title: 'Post your event', desc: 'Publish a hike, camp, or meetup — set the date, details, and who can join.' },
  { step: '4', title: 'Welcome your group', desc: 'Meet participants, lead the day, and watch your community grow.' },
];

const communityQuotes = [
  '"I hosted my first wadi walk and left with eight new hiking buddies."',
  '"Giving newcomers their first summit view — that feeling never gets old."',
  '"The UAE has so much to offer. Hosting lets me share that pride every weekend."',
];

type HostType = 'individual' | 'business';
type AppStatus = 'loading' | 'none' | 'pending' | 'approved' | 'rejected';

const emptyForm = {
  hostType: 'individual' as HostType,
  hostDisplayName: '',
  bio: '',
  profilePhoto: '',
  phoneCountryCode: DEFAULT_PHONE_DIAL,
  phone: '',
  nationality: '',
  residence: '',
  experience: '',
  languages: '',
  certificates: '',
  notableHikes: '',
  organizationName: '',
};

const splitStoredPhone = (value?: string | null): { dial: string; national: string } => {
  if (!value?.trim()) return { dial: DEFAULT_PHONE_DIAL, national: '' };
  const trimmed = value.trim();
  const match = [...PHONE_COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((country) => trimmed.startsWith(country.dial));
  if (match) {
    return { dial: match.dial, national: trimmed.slice(match.dial.length).trim() };
  }
  return { dial: DEFAULT_PHONE_DIAL, national: trimmed.replace(/^\+/, '') };
};

/** Become a host — individual or business. Route: /become-host (alias /become-organizer). */
export const BecomeOrganizer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isHost =
    user?.role === 'tenant_owner' || user?.role === 'tenant_admin' || user?.role === 'tenant_guide';

  const [appStatus, setAppStatus] = useState<AppStatus>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [rejectionNote, setRejectionNote] = useState<string | null>(null);

  useEffect(() => {
    if (isHost) {
      navigate('/organizer/overview', { replace: true });
      return;
    }
    if (!user) {
      setAppStatus('none');
      return;
    }
    api
      .getMyOrganizerApplication()
      .then((res) => {
        if (res.data) {
          const status = res.data.status.toLowerCase();
          if (status === 'pending') setAppStatus('pending');
          else if (status === 'approved') setAppStatus('approved');
          else if (status === 'rejected') {
            setAppStatus('rejected');
            setRejectionNote(res.data.reviewerNote ?? null);
          }
          else setAppStatus('none');
        } else {
          setAppStatus('none');
          setRejectionNote(null);
        }
      })
      .catch(() => setAppStatus('none'));
  }, [isHost, navigate, user]);

  const openForm = async () => {
    let nextForm = {
      ...emptyForm,
      hostDisplayName: user?.displayName ?? '',
    };

    try {
      const [profileRes, appRes] = await Promise.all([
        api.getMeProfile(),
        api.getMyOrganizerApplication(),
      ]);
      const profile = profileRes.data;
      const appMeta = appRes.data?.metadata;
      const storedPhone = splitStoredPhone(profile.phone ?? appMeta?.phoneE164 ?? appMeta?.phone);

      nextForm = {
        ...nextForm,
        hostDisplayName: profile.displayName ?? nextForm.hostDisplayName,
        bio: appMeta?.bio ?? profile.bio ?? '',
        phoneCountryCode: appMeta?.phoneCountryCode ?? storedPhone.dial,
        phone: appMeta?.phone ?? storedPhone.national,
        nationality: appMeta?.nationality ?? '',
        residence: appMeta?.residence ?? '',
        experience: appMeta?.experience ?? '',
        languages: appMeta?.languages ?? '',
        certificates: appMeta?.certificates ?? '',
        notableHikes: appMeta?.notableHikes ?? '',
        profilePhoto: appMeta?.profilePhoto ?? profile.avatarUrl ?? '',
        organizationName:
          appRes.data?.requestedType?.toLowerCase() === 'company' ? appRes.data.requestedName : '',
        hostType:
          appRes.data?.requestedType?.toLowerCase() === 'company' ? ('business' as const) : ('individual' as const),
      };
    } catch {
      // Prefill is best-effort; the form still opens with account defaults.
    }

    setForm(nextForm);
    setShowFormModal(true);
  };

  const handlePostEvent = () => {
    if (!user) {
      navigate('/signup?redirect=/become-host');
      return;
    }
    if (appStatus === 'pending') {
      document.getElementById('host-status')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    openForm();
  };

  const ctaDisabled = Boolean(user && appStatus === 'pending');
  const ctaLabel =
    user && appStatus === 'pending' ? 'Application in review' : 'Post your next event';

  if (isHost) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (form.hostType === 'business' && !form.organizationName.trim()) {
      setSubmitError('Business name is required.');
      return;
    }
    if (!form.hostDisplayName.trim()) {
      setSubmitError('Display name is required.');
      return;
    }
    if (!isValidNationalPhone(form.phone)) {
      setSubmitError('Enter a valid mobile number.');
      return;
    }

    const requestedName =
      form.hostType === 'business'
        ? form.organizationName.trim()
        : form.hostDisplayName.trim();

    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.submitOrganizerApplication({
        requestedName,
        requestedType: form.hostType === 'business' ? 'COMPANY' : 'GUIDE_OWNED',
        hostDisplayName: form.hostDisplayName.trim(),
        bio: form.bio.trim(),
        phoneCountryCode: form.phoneCountryCode,
        phone: form.phone.trim(),
        nationality: form.nationality,
        residence: form.residence,
        experience: form.experience,
        languages: form.languages,
        certificates: form.certificates,
        notableHikes: form.notableHikes,
        profilePhoto: form.profilePhoto,
      });
      setSubmitSuccess(true);
      setRejectionNote(null);
      setAppStatus('pending');
      setShowFormModal(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const PostEventButton = ({
    className = '',
    fullWidth = false,
  }: {
    className?: string;
    fullWidth?: boolean;
  }) => (
    <button
      type="button"
      onClick={handlePostEvent}
      disabled={ctaDisabled}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full font-bold text-sm shadow-sm hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      <CalendarPlus className="w-4 h-4" />
      {ctaLabel}
      {!ctaDisabled && <ArrowRight className="w-4 h-4" />}
    </button>
  );

  return (
    <>
      <PageMeta
        title="Become a host"
        description="Join the UAE Trails community as a host — make friends, give back, promote the outdoors, and post your next hike or camp."
        path="/become-organizer"
      />
      <ConsumerShell
        layout="editorial"
        maxWidth="4xl"
        eyebrow="Join the community"
        title="Become a host"
        banner={{ src: PAGE_BANNERS.community, alt: 'Group of friends hiking together' }}
        back={{ fallbackTo: user ? '/profile' : '/activities', label: user ? 'Profile' : 'Activities' }}
        toolbar={
          <div className="space-y-3">
            <p className="text-sm text-neutral-700 leading-relaxed">
              <span className="font-semibold text-neutral-900">Share the trails. Grow the tribe.</span>{' '}
              Host hikes and camps that bring people together — make friends, give back, and show off the UAE
              outdoors you love.
            </p>
            <PostEventButton fullWidth />
            {!user && (
              <p className="text-xs text-neutral-500 text-center">
                Already have an account?{' '}
                <Link to="/signin?redirect=/become-host" className="text-emerald-700 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            )}
          </div>
        }
      >
        <div className="space-y-8 md:space-y-10 pb-nav-safe animate-fade-up">
          {/* Why become a Host? */}
          <section>
            <div className="text-center mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1.5">Community first</p>
              <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900">Why become a Host?</h2>
              <p className="mt-2 text-sm text-neutral-600 max-w-xl mx-auto leading-relaxed">
                Hosting is about people — not just routes on a map. Lead with heart, welcome newcomers, and help
                build the UAE&apos;s outdoor community.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {whyHostReasons.map((item) => (
                <GlassCard key={item.title} padding>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.accent}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-neutral-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{item.description}</p>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* Community voices */}
          <section>
            <GlassCard padding className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white border-0">
              <p className="text-center text-xs font-bold uppercase tracking-widest text-emerald-200/90 mb-4">
                From the community
              </p>
              <div className="space-y-3">
                {communityQuotes.map((quote) => (
                  <blockquote key={quote} className="text-center text-sm text-emerald-50/95 italic leading-relaxed">
                    {quote}
                  </blockquote>
                ))}
              </div>
            </GlassCard>
          </section>

          {/* How it works */}
          <section>
            <h2 className="text-lg md:text-xl font-bold text-neutral-900 text-center mb-1">How it works</h2>
            <p className="text-sm text-neutral-500 text-center mb-5 max-w-md mx-auto">
              From application to your first group on the trail — we keep it simple.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {howItWorks.map((s) => (
                <GlassCard key={s.step} padding className="text-center">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto mb-2.5 text-sm">
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-1 text-sm">{s.title}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">{s.desc}</p>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* Status / apply */}
          <section id="host-status">
            {!user && (
              <GlassCard padding className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-4">
                  <CalendarPlus className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-lg font-bold text-neutral-900 mb-2">Ready to bring people together?</h2>
                <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
                  Create a free account, complete a short host profile, and post your first event when approved.
                </p>
                <PostEventButton fullWidth />
              </GlassCard>
            )}

            {user && appStatus === 'loading' && (
              <GlassCard padding className="text-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                <p className="text-sm text-neutral-500">Checking your host status…</p>
              </GlassCard>
            )}

            {user && (appStatus === 'pending' || submitSuccess) && (
              <GlassCard padding className="text-center border-amber-200/50">
                <Clock className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-neutral-900 mb-2">Almost there — we&apos;re reviewing your profile</h2>
                <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
                  Thanks for applying! Once approved, you can post your next event and start welcoming hikers &
                  campers to the community.
                </p>
                <Link to="/profile" className="text-sm text-emerald-600 font-semibold">
                  Back to profile
                </Link>
              </GlassCard>
            )}

            {user && appStatus === 'approved' && (
              <GlassCard padding className="text-center">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-neutral-900 mb-2">You&apos;re approved — let&apos;s go!</h2>
                <Link
                  to="/organizer/overview"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full text-sm font-bold"
                >
                  Post your next event <ArrowRight className="w-4 h-4" />
                </Link>
              </GlassCard>
            )}

            {user && appStatus === 'rejected' && !submitSuccess && (
              <GlassCard padding className="text-center border-red-100">
                <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-neutral-900 mb-2">Application not approved</h2>
                <p className="text-sm text-neutral-600 mb-3 leading-relaxed">
                  {rejectionNote
                    ? rejectionNote
                    : 'Update your host profile and apply again — we would love to have you in the community.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAppStatus('none');
                    openForm();
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full text-sm font-bold"
                >
                  Post your next event <ArrowRight className="w-4 h-4" />
                </button>
              </GlassCard>
            )}

            {user && appStatus === 'none' && !submitSuccess && (
              <GlassCard padding className="text-center">
                <Sparkles className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-neutral-900 mb-2">Your community is waiting</h2>
                <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
                  Complete a short host profile — individual guide or business — then post hikes, camps, and
                  meetups for others to join.
                </p>
                <PostEventButton fullWidth />
              </GlassCard>
            )}
          </section>

          {/* Bottom CTA */}
          <GlassCard padding className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white border-0 text-center">
            <h2 className="text-lg md:text-xl font-extrabold mb-2">The UAE outdoors is better shared</h2>
            <p className="text-sm text-emerald-100/90 mb-5 leading-relaxed">
              Someone out there is looking for their first hiking friend. Maybe that&apos;s you — ready to host.
            </p>
            <PostEventButton className="!bg-white !text-emerald-800 hover:!bg-emerald-50" />
          </GlassCard>
        </div>

        {showFormModal && user && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
            onClick={() => setShowFormModal(false)}
          >
            <div
              className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Host profile</h2>
                  <p className="text-xs text-gray-500">Step 1 before you post your first event</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Tell the community who you are. Every trip names the person responsible on the day — this is
                  the profile participants will trust.
                </p>

                <div className="flex gap-2 mb-5">
                  {(
                    [
                      { key: 'individual' as const, label: 'Individual', icon: User },
                      { key: 'business' as const, label: 'Business', icon: Building2 },
                    ] as const
                  ).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm({ ...form, hostType: key })}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-medium transition-colors ${
                        form.hostType === key
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Account email</p>
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Linked from your sign-in profile</p>
                  </div>

                  {form.hostType === 'business' && (
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">
                        Business / organization name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.organizationName}
                        onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2.5 text-sm"
                        placeholder="UAE Adventure Co"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Your name (display name) *</label>
                    <input
                      type="text"
                      required
                      value={form.hostDisplayName}
                      onChange={(e) => setForm({ ...form, hostDisplayName: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm"
                      placeholder="Name shown to participants"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">About you *</label>
                    <textarea
                      required
                      minLength={20}
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      rows={3}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm"
                      placeholder="Why do you love the outdoors? What kind of trips do you want to host? What makes your groups special?"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Min 20 characters — shown on your public profile and trip pages.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-2 block">Profile photo</label>
                    <ImageUpload
                      images={form.profilePhoto ? [form.profilePhoto] : []}
                      onChange={(urls) => setForm({ ...form, profilePhoto: urls[0] ?? '' })}
                      keyPrefix="host-profiles"
                      kind="avatar"
                      max={1}
                      label=""
                      preset="profile"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Mobile number *</label>
                    <PhoneInput
                      dialCode={form.phoneCountryCode}
                      nationalNumber={form.phone}
                      onDialCodeChange={(phoneCountryCode) => setForm({ ...form, phoneCountryCode })}
                      onNationalNumberChange={(phone) => setForm({ ...form, phone })}
                      required
                      disabled={submitting}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Saved as {formatE164Phone(form.phoneCountryCode, form.phone) || 'your full international number'}.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Nationality *</label>
                      <select
                        required
                        value={form.nationality}
                        onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2.5 text-sm"
                      >
                        <option value="">Select</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Based in *</label>
                      <select
                        required
                        value={form.residence}
                        onChange={(e) => setForm({ ...form, residence: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2.5 text-sm"
                      >
                        <option value="">Select</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Experience *</label>
                    <select
                      required
                      value={form.experience}
                      onChange={(e) => setForm({ ...form, experience: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm"
                    >
                      <option value="">Select…</option>
                      <option value="<1 year">Less than 1 year</option>
                      <option value="1-3 years">1–3 years</option>
                      <option value="3-5 years">3–5 years</option>
                      <option value="5+ years">5+ years</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Languages *</label>
                    <input
                      type="text"
                      required
                      value={form.languages}
                      onChange={(e) => setForm({ ...form, languages: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm"
                      placeholder="English, Arabic…"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Certificates</label>
                    <textarea
                      value={form.certificates}
                      onChange={(e) => setForm({ ...form, certificates: e.target.value })}
                      rows={2}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm"
                      placeholder="First aid, wilderness guide, etc."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Notable hikes & trips</label>
                    <textarea
                      value={form.notableHikes}
                      onChange={(e) => setForm({ ...form, notableHikes: e.target.value })}
                      rows={2}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm"
                      placeholder="Jebel Jais, Wadi Shawka…"
                    />
                  </div>

                  {submitError && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{submitError}</p>
                  )}

                  <div className="flex gap-3 pt-2 pb-nav-safe sm:pb-2">
                    <button
                      type="button"
                      onClick={() => setShowFormModal(false)}
                      className="flex-1 px-4 py-2.5 border rounded-full text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-full text-sm font-bold disabled:opacity-60"
                    >
                      {submitting ? 'Submitting…' : 'Submit & get ready to host'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </ConsumerShell>
    </>
  );
};
