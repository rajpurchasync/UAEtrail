import { useState } from 'react';
import { Search, MessageSquare, ThumbsUp, MapPin, Tent, TrendingUp, Plus, X, Send } from 'lucide-react';

interface Discussion {
  id: string;
  title: string;
  author: string;
  avatar: string;
  category: string;
  replies: Reply[];
  likes: string[];
  lastActivity: string;
  excerpt: string;
  content: string;
}

interface Reply {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: string[];
}

export const Community = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [expandedDiscussion, setExpandedDiscussion] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [discussions, setDiscussions] = useState<Discussion[]>([
    {
      id: '1',
      title: 'Best time to visit Jebel Jais Summit Trail?',
      author: 'Ahmed Al Mansoori',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      category: 'questions',
      replies: [
        {
          id: 'r1',
          author: 'Sarah Williams',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
          content: 'I recommend going in winter months (November to March). The weather is perfect and the views are stunning!',
          timestamp: '1 hour ago',
          likes: []
        },
        {
          id: 'r2',
          author: 'Mohammed Hassan',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
          content: 'Also bring plenty of water and start early in the morning to avoid the midday heat even in winter.',
          timestamp: '45 minutes ago',
          likes: []
        }
      ],
      likes: [],
      lastActivity: '2 hours ago',
      excerpt: 'Planning my first hike to Jebel Jais and wondering what\'s the best time of year to go? Any recommendations on what to bring?',
      content: 'Planning my first hike to Jebel Jais and wondering what\'s the best time of year to go? Any recommendations on what to bring?'
    },
    {
      id: '2',
      title: 'Amazing sunrise at Fossil Rock - Trip Report',
      author: 'Sarah Williams',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      category: 'trip-reports',
      replies: [],
      likes: [],
      lastActivity: '5 hours ago',
      excerpt: 'Just got back from an incredible camping trip at Fossil Rock. The sunrise was absolutely breathtaking! Here are some tips...',
      content: 'Just got back from an incredible camping trip at Fossil Rock. The sunrise was absolutely breathtaking! Here are some tips for anyone planning to visit.'
    },
    {
      id: '3',
      title: 'Hiking boots recommendation for UAE terrain',
      author: 'Mohammed Hassan',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      category: 'gear',
      replies: [],
      likes: [],
      lastActivity: '1 day ago',
      excerpt: 'Looking for durable hiking boots suitable for rocky terrain and hot weather. What have you all been using?',
      content: 'Looking for durable hiking boots suitable for rocky terrain and hot weather. What have you all been using?'
    },
    {
      id: '4',
      title: 'Family-friendly camping spots near Dubai?',
      author: 'Fatima Al Zaabi',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      category: 'questions',
      replies: [],
      likes: [],
      lastActivity: '1 day ago',
      excerpt: 'Planning a weekend camping trip with kids (ages 5 and 8). Looking for safe, accessible spots with basic facilities...',
      content: 'Planning a weekend camping trip with kids (ages 5 and 8). Looking for safe, accessible spots with basic facilities...'
    },
    {
      id: '5',
      title: 'Pro tip: Always check weather forecasts before mountain hikes',
      author: 'David Chen',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      category: 'tips',
      replies: [],
      likes: [],
      lastActivity: '2 days ago',
      excerpt: 'After experiencing sudden weather changes during my last hike, here are some safety tips everyone should know...',
      content: 'After experiencing sudden weather changes during my last hike, here are some safety tips everyone should know...'
    },
    {
      id: '6',
      title: 'Wadi Shawka Loop - Complete Guide',
      author: 'Lisa Anderson',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
      category: 'trip-reports',
      replies: [],
      likes: [],
      lastActivity: '3 days ago',
      excerpt: 'Comprehensive guide to the Wadi Shawka Loop trail including parking, trail conditions, and must-see viewpoints...',
      content: 'Comprehensive guide to the Wadi Shawka Loop trail including parking, trail conditions, and must-see viewpoints...'
    }
  ]);

  const categories = [
    { id: 'all', name: 'All', icon: MessageSquare },
    { id: 'trip-reports', name: 'Trip Reports', icon: MapPin },
    { id: 'questions', name: 'Questions', icon: MessageSquare },
    { id: 'tips', name: 'Tips & Tricks', icon: TrendingUp },
    { id: 'gear', name: 'Gear Reviews', icon: Tent }
  ];

  const filteredDiscussions = discussions.filter((discussion) => {
    const matchesCategory = selectedCategory === 'all' || discussion.category === selectedCategory;
    const matchesSearch = discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discussion.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (categoryId: string) => {
    const colors: Record<string, string> = {
      'trip-reports': 'bg-blue-100 text-blue-700',
      'questions': 'bg-stone-200 text-stone-800',
      'tips': 'bg-emerald-100 text-emerald-700',
      'gear': 'bg-teal-100 text-teal-700'
    };
    return colors[categoryId] || 'bg-stone-100 text-stone-700';
  };

  const handleLike = (discussionId: string) => {
    if (!isSignedIn) {
      alert('Please sign in to like discussions');
      return;
    }

    setDiscussions(prev => prev.map(d => {
      if (d.id === discussionId) {
        const userId = 'current-user';
        const hasLiked = d.likes.includes(userId);
        return {
          ...d,
          likes: hasLiked
            ? d.likes.filter(id => id !== userId)
            : [...d.likes, userId]
        };
      }
      return d;
    }));
  };

  const handleReplyLike = (discussionId: string, replyId: string) => {
    if (!isSignedIn) {
      alert('Please sign in to like replies');
      return;
    }

    setDiscussions(prev => prev.map(d => {
      if (d.id === discussionId) {
        return {
          ...d,
          replies: d.replies.map(r => {
            if (r.id === replyId) {
              const userId = 'current-user';
              const hasLiked = r.likes.includes(userId);
              return {
                ...r,
                likes: hasLiked
                  ? r.likes.filter(id => id !== userId)
                  : [...r.likes, userId]
              };
            }
            return r;
          })
        };
      }
      return d;
    }));
  };

  const handleReply = (discussionId: string) => {
    if (!isSignedIn) {
      alert('Please sign in to reply to discussions');
      return;
    }

    if (!replyText.trim()) return;

    setDiscussions(prev => prev.map(d => {
      if (d.id === discussionId) {
        const newReply: Reply = {
          id: `r${Date.now()}`,
          author: 'Current User',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
          content: replyText,
          timestamp: 'Just now',
          likes: []
        };
        return {
          ...d,
          replies: [...d.replies, newReply],
          lastActivity: 'Just now'
        };
      }
      return d;
    }));

    setReplyText('');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <section
        className="relative h-80 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=1600)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900/80 via-stone-800/70 to-stone-900/80" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="text-white max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Our Community</h1>
            <p className="text-lg md:text-xl text-stone-100 mb-6">
              Connect with fellow adventurers, share your experiences, and discover new trails together.
              A warm and welcoming space for all outdoor enthusiasts.
            </p>
            {!isSignedIn && (
              <button
                onClick={() => setIsSignedIn(true)}
                className="bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium inline-flex items-center"
              >
                Join Our Community
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {filteredDiscussions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No discussions found matching your search.</p>
            </div>
          ) : (
            filteredDiscussions.map((discussion) => (
              <div
                key={discussion.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={discussion.avatar}
                      alt={discussion.author}
                      className="w-14 h-14 rounded-full flex-shrink-0 border-2 border-stone-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3
                            className="text-xl font-semibold text-gray-900 hover:text-emerald-600 transition-colors cursor-pointer"
                            onClick={() => setExpandedDiscussion(expandedDiscussion === discussion.id ? null : discussion.id)}
                          >
                            {discussion.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{discussion.author} • {discussion.lastActivity}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getCategoryColor(discussion.category)}`}>
                          {categories.find(c => c.id === discussion.category)?.name || discussion.category}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4 leading-relaxed">{discussion.excerpt}</p>

                      <div className="flex items-center gap-6 text-sm">
                        <button
                          onClick={() => handleLike(discussion.id)}
                          className={`flex items-center gap-1 transition-colors ${
                            discussion.likes.includes('current-user') && isSignedIn
                              ? 'text-emerald-600 font-medium'
                              : 'text-gray-600 hover:text-emerald-600'
                          }`}
                        >
                          <ThumbsUp className={`w-4 h-4 ${discussion.likes.includes('current-user') && isSignedIn ? 'fill-current' : ''}`} />
                          <span>{discussion.likes.length} {discussion.likes.length === 1 ? 'Like' : 'Likes'}</span>
                        </button>
                        <button
                          onClick={() => setExpandedDiscussion(expandedDiscussion === discussion.id ? null : discussion.id)}
                          className="flex items-center gap-1 text-gray-600 hover:text-emerald-600 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{discussion.replies.length} {discussion.replies.length === 1 ? 'Reply' : 'Replies'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedDiscussion === discussion.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="space-y-4 mb-6">
                        {discussion.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3 pl-4">
                            <img
                              src={reply.avatar}
                              alt={reply.author}
                              className="w-10 h-10 rounded-full flex-shrink-0 border border-stone-200"
                            />
                            <div className="flex-1 bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">{reply.author}</span>
                                <span className="text-xs text-gray-500">{reply.timestamp}</span>
                              </div>
                              <p className="text-gray-700 mb-2">{reply.content}</p>
                              <button
                                onClick={() => handleReplyLike(discussion.id, reply.id)}
                                className={`flex items-center gap-1 text-xs transition-colors ${
                                  reply.likes.includes('current-user') && isSignedIn
                                    ? 'text-emerald-600 font-medium'
                                    : 'text-gray-600 hover:text-emerald-600'
                                }`}
                              >
                                <ThumbsUp className={`w-3 h-3 ${reply.likes.includes('current-user') && isSignedIn ? 'fill-current' : ''}`} />
                                <span>{reply.likes.length}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3 pl-4">
                        <img
                          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
                          alt="You"
                          className="w-10 h-10 rounded-full flex-shrink-0 border border-stone-200"
                        />
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            placeholder={isSignedIn ? "Write a reply..." : "Sign in to reply..."}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleReply(discussion.id)}
                            disabled={!isSignedIn}
                            className="flex-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
                          />
                          <button
                            onClick={() => handleReply(discussion.id)}
                            disabled={!isSignedIn || !replyText.trim()}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isSignedIn && (
        <button
          onClick={() => setShowNewDiscussionModal(true)}
          className="fixed bottom-8 right-8 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 hover:bg-emerald-700"
          aria-label="Start new discussion"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {showNewDiscussionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-emerald-600 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Start a New Discussion</h2>
              <button
                onClick={() => setShowNewDiscussionModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                    <option value="">Select a category</option>
                    <option value="trip-reports">Trip Reports</option>
                    <option value="questions">Questions</option>
                    <option value="tips">Tips & Tricks</option>
                    <option value="gear">Gear Reviews</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    placeholder="What's your discussion about?"
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={6}
                    placeholder="Share your thoughts, experiences, or questions..."
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowNewDiscussionModal(false);
                    }}
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-all font-medium"
                  >
                    Post Discussion
                  </button>
                  <button
                    onClick={() => setShowNewDiscussionModal(false)}
                    className="px-6 py-3 border border-stone-300 text-gray-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
