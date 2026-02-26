import { Trail } from '../types';

export const trails: Trail[] = [
  {
    id: 'trail-1',
    name: 'Jebel Jais Summit Trail',
    region: 'RAK',
    difficulty: 'hard',
    distance: 12.5,
    duration: 5.5,
    elevation: 850,
    season: ['winter', 'year-round'],
    childFriendly: false,
    description: 'Challenge yourself with the UAE\'s highest peak. This demanding trail rewards hikers with breathtaking panoramic views of the Hajar Mountains. Best attempted during cooler months.',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'
    ],
    featured: true
  },
  {
    id: 'trail-2',
    name: 'Wadi Shawka Loop',
    region: 'RAK',
    difficulty: 'moderate',
    distance: 8.0,
    duration: 3.0,
    elevation: 320,
    season: ['winter', 'year-round'],
    childFriendly: true,
    description: 'A scenic loop trail through Wadi Shawka with stunning mountain views and seasonal water pools. Perfect for families and intermediate hikers.',
    images: [
      'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'
    ],
    featured: true
  },
  {
    id: 'trail-3',
    name: 'Hatta Heritage Trail',
    region: 'Dubai',
    difficulty: 'easy',
    distance: 4.5,
    duration: 2.0,
    elevation: 120,
    season: ['winter', 'year-round'],
    childFriendly: true,
    description: 'Gentle trail through Hatta\'s historic village with cultural landmarks and beautiful mountain scenery. Ideal for beginners and families.',
    images: [
      'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800',
      'https://images.unsplash.com/photo-1508873881324-c92a3fc536ba?w=800'
    ],
    featured: false
  },
  {
    id: 'trail-4',
    name: 'Fossil Rock Trail',
    region: 'Sharjah',
    difficulty: 'moderate',
    distance: 6.5,
    duration: 2.5,
    elevation: 180,
    season: ['winter'],
    childFriendly: false,
    description: 'Desert trail leading to the famous Fossil Rock formation. Experience the unique geology and desert landscape of the UAE.',
    images: [
      'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800',
      'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=800'
    ],
    featured: true
  },
  {
    id: 'trail-5',
    name: 'Al Ain Mountain Trail',
    region: 'Al Ain',
    difficulty: 'easy',
    distance: 5.0,
    duration: 2.5,
    elevation: 150,
    season: ['winter', 'year-round'],
    childFriendly: true,
    description: 'Peaceful mountain trail near Al Ain with moderate elevation and beautiful valley views. Great for morning hikes.',
    images: [
      'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800',
      'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800'
    ],
    featured: false
  }
];
