import { Link } from 'react-router-dom';
import { ArrowRight, Check, Star, Trophy, Zap } from 'lucide-react';
import { FEATURE_FLAGS } from '../config/platform';
import { MobileBackButton } from '../components/mobile/MobileBackButton';
import { SUBSCRIPTION_PLANS } from '../constants/membershipTiers';

const PLAN_STYLES: Record<string, { card: string; accent: string; ring: string; cta: string }> = {
  active: {
    card: 'from-sky-50 to-blue-100',
    accent: 'text-sky-800',
    ring: 'ring-sky-300/60',
    cta: 'bg-gray-900 hover:bg-gray-800 text-white',
  },
  pro: {
    card: 'from-emerald-50 to-teal-100',
    accent: 'text-emerald-800',
    ring: 'ring-emerald-400/70',
    cta: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  goat: {
    card: 'from-amber-50 via-orange-50 to-amber-100',
    accent: 'text-amber-900',
    ring: 'ring-amber-400/80',
    cta: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white',
  },
};

export const Membership = () => {
  const testimonials = [
    {
      name: 'Ahmed Al Mansoori',
      tier: 'Pro member',
      text: 'Unlimited map downloads have saved me in wadis with zero signal. The partner discounts on gear paid for the membership in one shop visit.',
      rating: 5,
    },
    {
      name: 'Sarah Williams',
      tier: 'GOAT member',
      text: 'Five free hikes a month plus a personal guide on call — I finally stopped second-guessing route choices in new emirates.',
      rating: 5,
    },
    {
      name: 'Mohammed Hassan',
      tier: 'Active member',
      text: 'Started on Active pay-as-you-go. Only bought guides for the trails I actually hiked — perfect before I upgraded to Pro.',
      rating: 5,
    },
  ];

  const faqs = [
    {
      question: 'What is Active pay-as-you-go?',
      answer:
        'Active is free to join. When you want a location guide, you pay per trail or camp — that unlocks the offline map download and guide-on-call for that specific location.',
    },
    {
      question: 'What does Pro include vs Active?',
      answer:
        'Pro (AED 99/month) removes per-location fees for maps and guides, gives you unlimited offline downloads, and unlocks partner discounts across the Shop and experience partners.',
    },
    {
      question: 'Why choose GOAT at AED 499/month?',
      answer:
        'GOAT is built for serious explorers: 5 free guided hikes every month, unlimited maps, a personal guide on call, and free access to our full library of location guides — no pay-per-trail.',
    },
    {
      question: 'Can I earn Pro or GOAT through Trail Points instead?',
      answer:
        'Paid checkout launches soon. Today you can still earn contributor status and badges via Trail Points while subscriptions roll out.',
    },
    {
      question: 'Can I cancel Pro or GOAT anytime?',
      answer:
        'Yes. Cancel anytime and your access continues until the end of your billing period. Active remains free with no subscription required.',
    },
  ];

  return (
    <div className="min-h-screen consumer-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-safe-plus-2">
        <MobileBackButton fallbackTo="/profile/settings" label="Settings" className="py-2" />
      </div>
      {!FEATURE_FLAGS.membershipEnabled && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 text-center sm:text-left">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-200 text-amber-800 shrink-0">
              COMING SOON
            </span>
            <p className="text-sm text-amber-800">
              Pro &amp; GOAT checkout launches soon — start free on <strong>Active</strong> today, or earn badges via{' '}
              <Link to="/trail-points" className="underline font-semibold hover:text-amber-900">
                Trail Points
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/60 to-[#eef6f3]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 md:pt-20 md:pb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold uppercase tracking-wider mb-5">
              <Trophy className="w-3.5 h-3.5" />
              Membership
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Three tiers. One trail community.
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-2xl">
              Start free on <strong className="text-white">Active</strong> with pay-as-you-go guides. Upgrade to{' '}
              <strong className="text-white">Pro</strong> or <strong className="text-white">GOAT</strong> when the
              mountains call more often.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-4">
        {/* 3-tier pricing */}
        <section className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-emerald-600 text-xs font-bold uppercase tracking-[0.2em] mb-3">Plans</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Pick the pace that fits your adventures
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const styles = PLAN_STYLES[plan.key] ?? PLAN_STYLES.active;
              const isPaid = plan.price > 0;
              const checkoutDisabled = isPaid && !FEATURE_FLAGS.membershipEnabled;

              return (
                <article
                  key={plan.key}
                  className={`relative flex flex-col rounded-2xl bg-gradient-to-b ${styles.card} ring-1 ${styles.ring} p-6 md:p-7 shadow-sm hover:shadow-lg transition-shadow ${
                    plan.popular ? 'md:-mt-3 md:mb-3 md:pb-10 ring-2 ring-emerald-400/80' : ''
                  } ${plan.key === 'goat' && !plan.popular ? 'md:mt-0' : ''}`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white px-3 py-1 rounded-full shadow-md">
                      Most popular
                    </span>
                  )}
                  {plan.key === 'goat' && (
                    <span className="absolute -top-3 right-4 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 px-3 py-1 rounded-full shadow-sm">
                      Ultimate
                    </span>
                  )}

                  <div className="text-center mb-5">
                    <span className="text-4xl block mb-2" aria-hidden>
                      {plan.emoji}
                    </span>
                    <h3 className={`text-2xl font-extrabold ${styles.accent}`}>{plan.name}</h3>
                    <p className="text-sm text-gray-600 mt-1.5 leading-snug min-h-[2.5rem]">{plan.tagline}</p>
                  </div>

                  <div className="text-center mb-6 py-3 rounded-xl bg-white/70 border border-white/90">
                    <p className={`text-3xl font-extrabold tabular-nums ${styles.accent}`}>
                      {plan.priceLabel}
                      {plan.priceSuffix && (
                        <span className="text-base font-semibold text-gray-500">{plan.priceSuffix}</span>
                      )}
                    </p>
                    {plan.priceNote && <p className="text-xs text-gray-500 mt-1">{plan.priceNote}</p>}
                  </div>

                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2.5 text-sm text-gray-700 leading-snug">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${styles.accent}`} />
                        {benefit}
                      </li>
                    ))}
                  </ul>

                  {!isPaid ? (
                    <Link
                      to={plan.ctaPath}
                      className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm transition-colors ${styles.cta}`}
                    >
                      {plan.ctaLabel}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={checkoutDisabled}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-colors ${
                        checkoutDisabled
                          ? 'bg-white/70 text-gray-400 cursor-not-allowed border border-gray-200'
                          : styles.cta
                      }`}
                    >
                      {checkoutDisabled ? `${plan.ctaLabel} — coming soon` : plan.ctaLabel}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* Trail Points cross-sell */}
        <section className="mb-20">
          <div className="glass-card p-6 md:p-8 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div className="max-w-xl mb-6 lg:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-gray-900">Earn your status too</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Subscriptions unlock maps and guides. <strong>Trail Points</strong> unlock contributor badges on your
                profile — post, host, review, and invite friends to climb toward Active, Pro, and GOAT recognition in
                the community.
              </p>
            </div>
            <Link
              to="/trail-points"
              className="inline-flex items-center justify-center gap-2 shrink-0 px-6 py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
            >
              How Trail Points work
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Gift */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Gift a membership</h2>
          <p className="text-gray-500 text-center mb-8 max-w-lg mx-auto">
            Give Pro or GOAT to someone who lives for the outdoors.
          </p>
          <div className="glass-card p-6 md:p-8 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                disabled
                className="py-4 px-4 rounded-xl border-2 border-emerald-200 text-gray-400 cursor-not-allowed text-sm font-semibold"
              >
                Pro — 3 months
                <span className="block text-xs font-normal mt-0.5">Coming soon</span>
              </button>
              <button
                type="button"
                disabled
                className="py-4 px-4 rounded-xl border-2 border-amber-200 text-gray-400 cursor-not-allowed text-sm font-semibold"
              >
                GOAT — 1 month
                <span className="block text-xs font-normal mt-0.5">Coming soon</span>
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What members say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="glass-card p-6">
                <div className="flex items-center gap-0.5 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">&ldquo;{testimonial.text}&rdquo;</p>
                <p className="font-semibold text-gray-900">{testimonial.name}</p>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">{testimonial.tier}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently asked questions</h2>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq) => (
              <div key={faq.question} className="glass-card p-5 md:p-6">
                <h3 className="font-bold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
