import { Check, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Membership = () => {
  const freeTierFeatures = [
    'Join up to 3 trails',
    'Join free community trips',
    'Access basic location information',
    'Standard map views',
    'Community forum access'
  ];

  const premiumTierFeatures = [
    'Everything in Free',
    'Advanced offline maps with GPX downloads',
    'Early access to trip bookings',
    '15% discount on all gear purchases',
    'Access to exclusive premium trails & camps',
    'Priority customer support',
    'Detailed trail conditions & weather updates',
    'Personalized trip recommendations',
    'No ads'
  ];

  const testimonials = [
    {
      name: 'Ahmed Al Mansoori',
      text: 'Premium membership is worth every dirham! The offline maps have saved me multiple times in remote areas.',
      rating: 5
    },
    {
      name: 'Sarah Williams',
      text: 'Early booking access means I never miss out on popular trips. The gear discounts are a great bonus too!',
      rating: 5
    },
    {
      name: 'Mohammed Hassan',
      text: 'The exclusive trails available to premium members are absolutely stunning. Highly recommended!',
      rating: 5
    }
  ];

  const faqs = [
    {
      question: 'Can I cancel my premium membership anytime?',
      answer: 'Yes, you can cancel your premium membership at any time. Your access will continue until the end of your billing period.'
    },
    {
      question: 'Do offline maps work without internet?',
      answer: 'Yes! Once downloaded, offline maps work completely without internet connection, perfect for remote trails and desert areas.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and popular digital payment methods in the UAE.'
    },
    {
      question: 'Can I gift a premium membership?',
      answer: 'Yes! You can purchase gift memberships for friends and family. Gift vouchers are also available.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <section
        className="relative h-80 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-5xl font-bold mb-4">Choose Your Membership</h1>
            <p className="text-xl">Unlock the full potential of UAE outdoor adventures</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Free</h2>
            <div className="text-4xl font-bold text-gray-900 mb-6">
              AED 0<span className="text-lg font-normal text-gray-600">/month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {freeTierFeatures.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/discovery"
              className="block w-full bg-gray-900 text-white text-center py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Get Started Free
            </Link>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg shadow-xl p-8 text-white relative">
            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-semibold">
              POPULAR
            </div>

            <h2 className="text-2xl font-bold mb-2">Premium</h2>
            <div className="mb-2">
              <span className="text-4xl font-bold">AED 99</span>
              <span className="text-lg">/month</span>
            </div>
            <div className="text-emerald-100 mb-6">or AED 999/year (save 16%)</div>

            <ul className="space-y-3 mb-8">
              {premiumTierFeatures.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-white mr-2 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button className="block w-full bg-white text-emerald-600 text-center py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium">
              Upgrade to Premium
            </button>
          </div>
        </div>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Gift Membership</h2>
          <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
            <p className="text-gray-600 mb-6 text-center">
              Give the gift of adventure! Purchase a premium membership for someone special.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button className="border-2 border-emerald-600 text-emerald-600 py-3 rounded-lg hover:bg-emerald-50 transition-colors font-medium">
                3 Months - AED 297
              </button>
              <button className="border-2 border-emerald-600 text-emerald-600 py-3 rounded-lg hover:bg-emerald-50 transition-colors font-medium">
                6 Months - AED 594
              </button>
              <button className="bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                1 Year - AED 999
              </button>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What Members Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">{testimonial.text}</p>
                <p className="font-semibold text-gray-900">{testimonial.name}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
