export interface OperatorReview {
  id: string;
  operatorId: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  tripId: string;
  tripName: string;
  comment: string;
}

export const operatorReviews: OperatorReview[] = [
  {
    id: 'or-1',
    operatorId: 'op-1',
    author: 'Ahmed Al Mansouri',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    rating: 5,
    date: '2024-01-15',
    tripId: 'trip-1',
    tripName: 'Jebel Jais Summit Hike',
    comment: 'Sarah was an outstanding guide! Her knowledge of the area and attention to safety made the experience truly memorable. Highly recommend!'
  },
  {
    id: 'or-2',
    operatorId: 'op-1',
    author: 'Emma Thompson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    rating: 5,
    date: '2024-01-10',
    tripId: 'trip-2',
    tripName: 'Wadi Shawka Adventure',
    comment: 'Perfect trip from start to finish. Sarah\'s enthusiasm and expertise made the hike enjoyable for everyone in the group.'
  },
  {
    id: 'or-3',
    operatorId: 'op-2',
    author: 'Mohammad Hassan',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    rating: 5,
    date: '2024-01-12',
    tripId: 'trip-3',
    tripName: 'Fossil Rock Desert Camp',
    comment: 'James created an amazing family-friendly camping experience. The kids had a blast and learned so much. Will definitely book again!'
  },
  {
    id: 'or-4',
    operatorId: 'op-2',
    author: 'Lisa Anderson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    rating: 4,
    date: '2024-01-08',
    tripId: 'trip-3',
    tripName: 'Fossil Rock Desert Camp',
    comment: 'Great experience overall. James was very accommodating and made sure everyone felt comfortable throughout the trip.'
  },
  {
    id: 'or-5',
    operatorId: 'op-3',
    author: 'David Chen',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    rating: 5,
    date: '2024-01-14',
    tripId: 'trip-1',
    tripName: 'Jebel Jais Summit Hike',
    comment: 'Emma\'s mountain guiding skills are exceptional. Her professionalism and experience showed throughout the challenging hike.'
  },
  {
    id: 'or-6',
    operatorId: 'op-4',
    author: 'Fatima Al Zaabi',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
    rating: 5,
    date: '2024-01-11',
    tripId: 'trip-4',
    tripName: 'Hatta Dam Camping',
    comment: 'Michael\'s desert expertise is unmatched. The camping setup was perfect and his stories around the campfire were captivating.'
  },
  {
    id: 'or-7',
    operatorId: 'op-5',
    author: 'Sarah Williams',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    rating: 5,
    date: '2024-01-09',
    tripId: 'trip-5',
    tripName: 'Family Desert Adventure',
    comment: 'Lisa made our family trip unforgettable. She was amazing with the kids and created activities that everyone could enjoy together.'
  }
];
