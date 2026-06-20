import { Link, useNavigate } from 'react-router-dom';
import { Mountain, CheckCircle, Users, MapPin, Calendar, Star, ArrowRight, Loader2, Clock, XCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '../api/services';

const benefits = [
  { icon: Calendar, title: 'Create & Manage Trips', description: 'Organize hiking and camping trips with easy event management tools.' },
  { icon: Users, title: 'Build Your Community', description: 'Connect with outdoor enthusiasts and grow your following.' },
  { icon: MapPin, title: 'Showcase Your Expertise', description: 'Build a verified profile with reviews from trip participants.' },
  { icon: Star, title: 'Earn Recognition', description: 'Get featured on the platform and earn badges for great trips.' },
];

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Argentina','Armenia','Australia','Austria','Azerbaijan',
  'Bahrain','Bangladesh','Belarus','Belgium','Bhutan','Bolivia','Bosnia and Herzegovina','Brazil','Brunei','Bulgaria',
  'Cambodia','Cameroon','Canada','Chile','China','Colombia','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic',
  'Denmark','Dominican Republic','Ecuador','Egypt','El Salvador','Estonia','Ethiopia','Fiji','Finland','France',
  'Georgia','Germany','Ghana','Greece','Guatemala','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq',
  'Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Kyrgyzstan','Laos','Latvia',
  'Lebanon','Libya','Lithuania','Luxembourg','Malaysia','Maldives','Malta','Mexico','Moldova','Monaco','Mongolia',
  'Montenegro','Morocco','Mozambique','Myanmar','Nepal','Netherlands','New Zealand','Nigeria','North Macedonia',
  'Norway','Oman','Pakistan','Palestine','Panama','Paraguay','Peru','Philippines','Poland','Portugal','Qatar',
  'Romania','Russia','Rwanda','Saudi Arabia','Senegal','Serbia','Singapore','Slovakia','Slovenia','Somalia',
  'South Africa','South Korea','Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan','Tajikistan',
  'Tanzania','Thailand','Tunisia','Turkey','Turkmenistan','UAE','Uganda','Ukraine','United Kingdom','United States',
  'Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
];

type AppStatus = 'loading' | 'none' | 'pending' | 'approved' | 'rejected';

export const BecomeOrganizer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isOrganizer =
    user?.role === 'tenant_owner' || user?.role === 'tenant_admin' || user?.role === 'tenant_guide';

  const [appStatus, setAppStatus] = useState<AppStatus>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);

  const [form, setForm] = useState({
    profilePhoto: '',
    phone: '',
    nationality: '',
    residence: '',
    experience: '',
    languages: '',
    certificates: '',
    notableHikes: '',
    organizationName: '',
    organizationType: 'guide' as 'guide' | 'company',
  });

  useEffect(() => {
    if (isOrganizer) {
      navigate('/organizer/overview', { replace: true });
      return;
    }
    if (!user) {
      setAppStatus('none');
      return;
    }
    // Check existing application
    api.getMyOrganizerApplication()
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
  }, [isOrganizer, navigate, user]);

  if (isOrganizer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.submitOrganizerApplication({
        requestedName: form.organizationName || `${user.displayName ?? user.email?.split('@')[0]} Adventures`,
        requestedType: form.organizationType === 'company' ? 'COMPANY' : 'GUIDE_OWNED',
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
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section
        className="relative h-[40vh] min-h-[280px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        <div className="relative text-center text-white px-6 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 leading-tight">
            Become an Organizer
          </h1>
          <p className="text-sm sm:text-base text-white/80 leading-relaxed">
            Lead outdoor adventures, share your knowledge of UAE trails, and build a community of like-minded explorers.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-10 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-8">Why Become an Organizer?</h2>
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

      {/* How it works */}
      <section className="py-10 md:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-8">How It Works</h2>
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {[
              { step: '1', title: 'Sign Up', desc: 'Create your account or log in to your existing one.' },
              { step: '2', title: 'Apply', desc: 'Submit your organizer application with your experience details.' },
              { step: '3', title: 'Get Verified', desc: 'Our team reviews your application and verifies your profile.' },
              { step: '4', title: 'Start Leading', desc: 'Create trips, invite participants, and build your reputation.' },
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

      {/* Application Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-lg mx-auto px-4">
          {/* Not logged in */}
          {!user && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-4">
                <Mountain className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Ready to Get Started?</h2>
              <p className="text-sm text-gray-500 mb-6">
                Sign up for a free account to begin your organizer journey.
              </p>
              <Link
                to="/signup"
                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-2 text-sm"
              >
                Sign Up to Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/" className="block mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Back to Home
              </Link>
            </div>
          )}

          {/* Loading */}
          {user && appStatus === 'loading' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Checking application status...</p>
            </div>
          )}

          {/* Pending */}
          {user && (appStatus === 'pending' || submitSuccess) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Application Under Review</h2>
              <p className="text-sm text-gray-500 mb-4">
                Your organizer application has been submitted and is being reviewed by our team. We'll notify you once a decision is made.
              </p>
              <Link to="/" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                Back to Home
              </Link>
            </div>
          )}

          {/* Approved (shouldn't normally reach here due to redirect, but just in case) */}
          {user && appStatus === 'approved' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Application Approved!</h2>
              <p className="text-sm text-gray-500 mb-4">
                Congratulations! Your organizer application has been approved.
              </p>
              <Link
                to="/organizer/overview"
                className="px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-colors inline-flex items-center gap-2 text-sm"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Rejected */}
          {user && appStatus === 'rejected' && !submitSuccess && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Application Not Approved</h2>
              <p className="text-sm text-gray-500 mb-4">
                Your previous application was not approved. You can re-apply below with updated information.
              </p>
              <button
                onClick={() => setAppStatus('none')}
                className="px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-colors inline-flex items-center gap-2 text-sm"
              >
                Re-apply <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Application Form — CTA that opens modal */}
          {user && appStatus === 'none' && !submitSuccess && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-4">
                <Mountain className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Ready to Apply?</h2>
              <p className="text-sm text-gray-500 mb-6">
                Submit your organizer application with your experience details. Our team will review it promptly.
              </p>
              <button
                onClick={() => setShowFormModal(true)}
                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-2 text-sm"
              >
                Apply Now <ArrowRight className="w-4 h-4" />
              </button>
              <Link to="/" className="block mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ──── Application Form Modal ──── */}
      {showFormModal && user && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setShowFormModal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h2 className="text-base font-bold text-gray-900">Organizer Application</h2>
              <button onClick={() => setShowFormModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-500 mb-5">Fill in your details below. All applications are reviewed by our admin team.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Read-only account info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Name</label>
                    <input type="text" readOnly value={user.displayName ?? ''}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
                    <input type="text" readOnly value={user.email ?? ''}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
                  </div>
                </div>

                {/* Profile Photo */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Profile Photo URL</label>
                  <input type="url" value={form.profilePhoto} onChange={(e) => setForm({ ...form, profilePhoto: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm" placeholder="https://..." />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Phone Number *</label>
                  <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm" placeholder="+971 50 123 4567" />
                </div>

                {/* Nationality & Residence */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Nationality *</label>
                    <select required value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm">
                      <option value="">Select country</option>
                      {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Residence *</label>
                    <select required value={form.residence} onChange={(e) => setForm({ ...form, residence: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm">
                      <option value="">Select country</option>
                      {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Years of Experience *</label>
                  <select required value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm">
                    <option value="">Select...</option>
                    <option value="<1 year">Less than 1 year</option>
                    <option value="1-3 years">1-3 years</option>
                    <option value="3-5 years">3-5 years</option>
                    <option value="5+ years">5+ years</option>
                  </select>
                </div>

                {/* Languages */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Languages Spoken *</label>
                  <input type="text" required value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm" placeholder="English, Arabic, Hindi..." />
                </div>

                {/* Certificates */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Certificates & Qualifications</label>
                  <textarea value={form.certificates} onChange={(e) => setForm({ ...form, certificates: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm" rows={2} placeholder="First-aid certified, Wilderness guide training, etc." />
                </div>

                {/* Notable Hikes */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Notable Hikes</label>
                  <textarea value={form.notableHikes} onChange={(e) => setForm({ ...form, notableHikes: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm" rows={2} placeholder="Jebel Jais summit, Wadi Shawka waterfall trail, etc." />
                </div>

                {/* Organization Name & Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Organization Name</label>
                    <input type="text" value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm" placeholder="My Adventures" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Type *</label>
                    <select required value={form.organizationType} onChange={(e) => setForm({ ...form, organizationType: e.target.value as 'guide' | 'company' })}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm">
                      <option value="guide">Independent Guide</option>
                      <option value="company">Company</option>
                    </select>
                  </div>
                </div>

                {submitError && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{submitError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowFormModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-2 text-sm disabled:opacity-60">
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Submit Application</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
