import { useNavigate } from 'react-router-dom';
import { Compass, CalendarCheck, ArrowRight } from 'lucide-react';

const options = [
  {
    id: 'organize',
    label: 'Organize your first Trip',
    description: 'Lead adventures, create trips, and build your community of explorers.',
    icon: CalendarCheck,
    color: 'emerald',
    route: '/become-organizer',
  },
  {
    id: 'join',
    label: 'Join a Trip',
    description: 'Browse upcoming hiking and camping trips and join outdoor adventures.',
    icon: Compass,
    color: 'blue',
    route: '/trips',
  },
] as const;

const colorMap: Record<string, { bg: string; icon: string; border: string; hover: string }> = {
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    border: 'border-emerald-200',
    hover: 'hover:border-emerald-400 hover:bg-emerald-50/50',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
    hover: 'hover:border-blue-400 hover:bg-blue-50/50',
  },
};

export const Onboarding = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-xl border shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Welcome to UAE Trails!</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          What would you like to do first?
        </p>

        <div className="space-y-3 mb-6">
          {options.map((option) => {
            const cm = colorMap[option.color];
            const Icon = option.icon;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => navigate(option.route)}
                className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left group ${cm.border} ${cm.hover}`}
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${cm.bg}`}>
                  <Icon className={`w-6 h-6 ${cm.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{option.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};
