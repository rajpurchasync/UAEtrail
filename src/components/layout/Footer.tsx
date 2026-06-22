import { Mountain, Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FEATURE_FLAGS } from '../../config/platform';

export const Footer = () => {
  const { user } = useAuth();
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Mountain className="w-8 h-8 text-emerald-500" />
              <span className="text-xl font-bold text-white">UAE Trail</span>
            </div>
            <p className="text-sm">
              Discover the beauty of UAE's mountains and deserts through guided hiking and camping experiences.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/discovery" className="hover:text-emerald-500 transition-colors">
                  Trails & Camps
                </Link>
              </li>
              <li>
                <Link to="/trips" className="hover:text-emerald-500 transition-colors">
                  Trips
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-emerald-500 transition-colors">
                  Gear Shop
                </Link>
              </li>
              <li>
                <Link to="/trail-points" className="hover:text-emerald-500 transition-colors">
                  Trail Points
                </Link>
              </li>
              {FEATURE_FLAGS.membershipEnabled && (
                <li>
                  <Link to="/membership" className="hover:text-emerald-500 transition-colors">
                    Membership
                  </Link>
                </li>
              )}
              <li>
                <Link
                  to={user ? '/become-host' : '/signin?redirect=/become-host'}
                  className="hover:text-emerald-500 transition-colors"
                >
                  Become a Host
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">About</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="hover:text-emerald-500 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="mailto:support@uaetrail.ae" className="hover:text-emerald-500 transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <Link to="/faq" className="hover:text-emerald-500 transition-colors">
                  Safety & preparation
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-emerald-500 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-emerald-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-emerald-500 transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-emerald-500 transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-emerald-500 transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
            </div>
            <p className="text-sm mt-4">
              Always prioritize safety. Check weather conditions and inform someone of your plans before heading out.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>&copy; 2026 UAE Trail. All rights reserved.</p>
          <a href="/llms.txt" className="hover:text-emerald-500 transition-colors text-xs mt-2 inline-block">
            AI / LLM site guide
          </a>
        </div>
      </div>
    </footer>
  );
};
