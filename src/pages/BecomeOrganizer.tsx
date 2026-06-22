import { Link, useNavigate } from 'react-router-dom';
import { Mountain, CheckCircle, Users, MapPin, Star, ArrowRight, Loader2, Clock, XCircle, X, User, Building2 } from 'lucide-react';
import { NAV_ICONS } from '../config/navIcons';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '../api/services';
import { MobileDetailShell } from '../components/mobile/MobileDetailShell';
import { PageMeta } from '../components/seo/PageMeta';
import { ImageUpload } from '../components/ui/ImageUpload';
import { COUNTRIES } from '../constants';

const benefits = [
  { icon: NAV_ICONS.trips, title: 'Host trips', description: 'Lead hikes and camps as an independent guide or on behalf of your business.' },
  { icon: Users, title: 'Build your community', description: 'Connect with outdoor enthusiasts and grow a following around your adventures.' },
  { icon: MapPin, title: 'Public host profile', description: 'Showcase your bio, certificates, and reviews — visitors see who is responsible on the day.' },
  { icon: Star, title: 'Individual or business', description: 'Apply as a solo host or register a company and add team members who can host events.' },
];

type HostType = 'individual' | 'business';
type AppStatus = 'loading' | 'none' | 'pending' | 'approved' | 'rejected';

const emptyForm = {
  hostType: 'individual' as HostType,
  hostDisplayName: '',
  bio: '',
  profilePhoto: '',
  phone: '',
  nationality: '',
  residence: '',
  experience: '',
  languages: '',
  certificates: '',
  notableHikes: '',
  organizationName: '',
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
          else if (status === 'rejected') setAppStatus('rejected');
          else setAppStatus('none');
        } else {
          setAppStatus('none');
        }
      })
      .catch(() => setAppStatus('none'));
  }, [isHost, navigate, user]);

  const openForm = () => {
    setForm({
      ...emptyForm,
      hostDisplayName: user?.displayName ?? '',
    });
    setShowFormModal(true);
  };

  if (isHost) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (form.hostType === 'business' && !form.organizationName.trim()) {
      setSubmitError('Business name is required.');
      return;
    }

    const requestedName =
      form.hostType === 'business'
        ? form.organizationName.trim()
        : form.hostDisplayName.trim() || `${user.displayName ?? 'My'} Adventures`;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.submitOrganizerApplication({
        requestedName,
        requestedType: form.hostType === 'business' ? 'COMPANY' : 'GUIDE_OWNED',
        hostDisplayName: form.hostDisplayName.trim(),
        bio: form.bio.trim(),
        phone: form.phone,
        nationality: form.nationality,
        residence: form.residence,
        experience: form.experience,
        languages: form.languages,
        certificates: form.certificates,
        notableHikes: form.notableHikes,
        profilePhoto: form.profilePhoto,
      });
      setSubmitSuccess(true);
      setAppStatus('pending');
      setShowFormModal(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileDetailShell backTo="/profile" backLabel="Profile">
      <PageMeta
        title="Become a host"
        description="Apply to host hikes and camping trips on UAE Trail — as an individual guide or registered outdoor business."
        path="/become-organizer"
      />
      <div className="min-h-screen bg-ios-bg md:bg-gray-50">
        <section
          className="relative h-[40vh] min-h-[280px] bg-cover bg-center flex items-center justify-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
          <div className="relative text-center text-white px-6 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 leading-tight">
              Become a Host
            </h1>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed">
              Any member can apply to host trips — as an individual guide or a registered business. Fill in your host profile and start leading adventures after verification.
            </p>
          </div>
        </section>

        <section className="py-10 md:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-8">Why host on UAE Trails?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {benefits.map((b) => (
                <div key={b.title} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                    <b.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{b.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 md:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-8">How it works</h2>
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              {[
                { step: '1', title: 'Sign up', desc: 'Create a free account or sign in.' },
                { step: '2', title: 'Host profile', desc: 'Choose individual or business and complete your host profile.' },
                { step: '3', title: 'Verification', desc: 'Our team reviews your application.' },
                { step: '4', title: 'Start hosting', desc: 'Create trips, assign yourself or team members as the on-day host.' },
              ].map((s) => (
                <div key={s.step} className="flex-1 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto mb-3 text-sm">
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">{s.title}</h3>
                  <p className="text-xs text-gray-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="max-w-lg mx-auto px-4">
            {!user && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-4">
                  <Mountain className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Ready to host?</h2>
                <p className="text-sm text-gray-500 mb-6">Sign up for a free account, then complete your host profile.</p>
                <Link
                  to="/signup?redirect=/become-host"
                  className="w-full px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-2 text-sm"
                >
                  Sign up to apply <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {user && appStatus === 'loading' && (
              <div className="bg-white rounded-2xl border p-8 text-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">Checking application status…</p>
              </div>
            )}

            {user && (appStatus === 'pending' || submitSuccess) && (
              <div className="bg-white rounded-2xl border p-8 text-center">
                <Clock className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-gray-900 mb-2">Host application under review</h2>
                <p className="text-sm text-gray-500 mb-4">
                  We received your host profile. You&apos;ll be notified once approved — then you can create trips and appear on the platform.
                </p>
                <Link to="/profile" className="text-sm text-emerald-600 font-medium">Back to profile</Link>
              </div>
            )}

            {user && appStatus === 'approved' && (
              <div className="bg-white rounded-2xl border p-8 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-gray-900 mb-2">You&apos;re approved!</h2>
                <Link to="/organizer/overview" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full text-sm font-semibold">
                  Go to host hub <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {user && appStatus === 'rejected' && !submitSuccess && (
              <div className="bg-white rounded-2xl border p-8 text-center">
                <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-gray-900 mb-2">Application not approved</h2>
                <p className="text-sm text-gray-500 mb-4">Update your host profile and apply again.</p>
                <button type="button" onClick={() => { setAppStatus('none'); openForm(); }}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-full text-sm font-semibold">
                  Re-apply
                </button>
              </div>
            )}

            {user && appStatus === 'none' && !submitSuccess && (
              <div className="bg-white rounded-2xl border p-8 shadow-sm text-center">
                <Mountain className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-gray-900 mb-2">Apply to become a host</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Complete your host profile — individual guide or business. This is what visitors see when you lead a trip.
                </p>
                <button type="button" onClick={openForm}
                  className="w-full px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold text-sm">
                  Start host profile <ArrowRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            )}
          </div>
        </section>

        {showFormModal && user && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setShowFormModal(false)}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between z-10">
                <h2 className="text-base font-bold text-gray-900">Host profile</h2>
                <button type="button" onClick={() => setShowFormModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-500 mb-4">
                  Choose how you want to host. Every trip must name the person responsible on the day.
                </p>

                <div className="flex gap-2 mb-5">
                  {([
                    { key: 'individual' as const, label: 'Individual', icon: User },
                    { key: 'business' as const, label: 'Business', icon: Building2 },
                  ]).map(({ key, label, icon: Icon }) => (
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
                  {form.hostType === 'business' && (
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Business / organization name *</label>
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
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Your name (as host) *
                    </label>
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
                      placeholder="Your experience, what you offer, and why people should join your trips…"
                    />
                    <p className="text-xs text-gray-400 mt-1">Min 20 characters — shown on your public profile and trip pages.</p>
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
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Phone *</label>
                    <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm" placeholder="+971 50 123 4567" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Nationality *</label>
                      <select required value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2.5 text-sm">
                        <option value="">Select</option>
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Based in *</label>
                      <select required value={form.residence} onChange={(e) => setForm({ ...form, residence: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2.5 text-sm">
                        <option value="">Select</option>
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Experience *</label>
                    <select required value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm">
                      <option value="">Select…</option>
                      <option value="<1 year">Less than 1 year</option>
                      <option value="1-3 years">1–3 years</option>
                      <option value="3-5 years">3–5 years</option>
                      <option value="5+ years">5+ years</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Languages *</label>
                    <input type="text" required value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm" placeholder="English, Arabic…" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Certificates</label>
                    <textarea value={form.certificates} onChange={(e) => setForm({ ...form, certificates: e.target.value })}
                      rows={2} className="w-full border rounded-xl px-3 py-2.5 text-sm"
                      placeholder="First aid, wilderness guide, etc." />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Notable hikes & trips</label>
                    <textarea value={form.notableHikes} onChange={(e) => setForm({ ...form, notableHikes: e.target.value })}
                      rows={2} className="w-full border rounded-xl px-3 py-2.5 text-sm"
                      placeholder="Jebel Jais, Wadi Shawka…" />
                  </div>

                  {submitError && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{submitError}</p>}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowFormModal(false)}
                      className="flex-1 px-4 py-2.5 border rounded-full text-sm font-medium">Cancel</button>
                    <button type="submit" disabled={submitting}
                      className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-full text-sm font-semibold disabled:opacity-60">
                      {submitting ? 'Submitting…' : 'Submit application'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileDetailShell>
  );
};
