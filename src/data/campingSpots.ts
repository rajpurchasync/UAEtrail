import { CampingSpot } from '../types';

export const campingSpots: CampingSpot[] = [
  {
    id: 'camp-1',
    name: 'Jebel Jais Base Camp',
    region: 'RAK',
    campingType: 'operator-led',
    season: ['winter', 'year-round'],
    maxGroupSize: 15,
    accessibility: 'car-accessible',
    difficulty: 'moderate',
    description: 'Premium camping experience at the foot of UAE\'s highest mountain. Includes organized activities, meals, and equipment. Perfect for those new to camping.',
    images: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
      'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800',
      'https://images.unsplash.com/photo-1571863533956-01c88e79957e?w=800'
    ],
    featured: true
  },
  {
    id: 'camp-2',
    name: 'Fossil Rock Desert Camp',
    region: 'Sharjah',
    campingType: 'self-guided',
    season: ['winter'],
    maxGroupSize: 20,
    accessibility: 'remote',
    description: 'Wild desert camping near the iconic Fossil Rock. Bring your own equipment and experience the authentic desert under the stars.',
    images: [
      'https://images.unsplash.com/photo-1520904549193-5ab44c10b0d8?w=800',
      'https://images.unsplash.com/photo-1537905569824-f89f14cceb68?w=800'
    ],
    featured: true
  },
  {
    id: 'camp-3',
    name: 'Hatta Dam Camping',
    region: 'Dubai',
    campingType: 'operator-led',
    season: ['winter', 'year-round'],
    maxGroupSize: 12,
    accessibility: 'car-accessible',
    difficulty: 'easy',
    description: 'Lakeside camping with kayaking activities and mountain views. Family-friendly with facilities and guided activities included.',
    images: [
      'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800',
      'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800'
    ],
    featured: false
  },
  {
    id: 'camp-4',
    name: 'Wadi Shawka Camping Ground',
    region: 'RAK',
    campingType: 'self-guided',
    season: ['winter'],
    maxGroupSize: 25,
    accessibility: 'car-accessible',
    description: 'Popular self-guided camping spot with basic facilities. Ideal for experienced campers looking for a convenient mountain location.',
    images: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
      'https://images.unsplash.com/photo-1537905569824-f89f14cceb68?w=800'
    ],
    featured: true
  },
  {
    id: 'camp-5',
    name: 'Al Qudra Desert Retreat',
    region: 'Dubai',
    campingType: 'operator-led',
    season: ['winter', 'year-round'],
    maxGroupSize: 10,
    accessibility: 'car-accessible',
    difficulty: 'easy',
    description: 'Luxury desert camping near Al Qudra Lakes with wildlife viewing opportunities. Premium tents, meals, and guided desert experiences.',
    images: [
      'https://images.unsplash.com/photo-1520904549193-5ab44c10b0d8?w=800',
      'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800',
      'https://images.unsplash.com/photo-1571863533956-01c88e79957e?w=800'
    ],
    featured: false
  }
];
