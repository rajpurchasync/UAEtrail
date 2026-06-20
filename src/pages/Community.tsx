import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MessageSquare, ThumbsUp, Plus, X, Send, MapPin } from 'lucide-react';
import { PostDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { ImageUpload } from '../components/ui/ImageUpload';

export const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'questions', locationId: '', images: [] as string[] });
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await api.getPosts({
        category: selectedCategory,
        search: searchQuery || undefined
      });
      setPosts(res.data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPosts();
  };

  const handleReply = async (postId: string) => {
    if (!user) {
      navigate('/signin');
      return;
    }
    if (!replyText.trim()) return;
    await api.replyToPost(postId, replyText.trim());
    setReplyText('');
    const res = await api.getPost(postId);
    setPosts((prev) => prev.map((p) => (p.id === postId ? res.data : p)));
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      navigate('/signin');
      return;
    }
    await api.togglePostLike(postId);
    loadPosts();
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/signin');
      return;
    }
    setSubmitting(true);
    try {
      await api.createPost({
        category: newPost.category,
        title: newPost.title,
        content: newPost.content,
        locationId: newPost.locationId || undefined,
        images: newPost.images
      });
      setShowNewPost(false);
      setNewPost({ title: '', content: '', category: 'questions', locationId: '', images: [] });
      loadPosts();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-nav-safe md:pb-8">
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Community</h1>
              <p className="text-sm text-gray-600 mt-1">Questions, trip reports & photos — anchored to UAE locations</p>
            </div>
            <button
              onClick={() => (user ? setShowNewPost(true) : navigate('/signin'))}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              New post
            </button>
          </div>

          <form onSubmit={handleSearch} className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </form>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${selectedCategory === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              All
            </button>
            {COMMUNITY_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${selectedCategory === cat.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-600">No posts yet. Be the first to ask a question!</p>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  {post.authorAvatar ? (
                    <img src={post.authorAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                      {post.authorName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">{post.authorName}</span>
                      <span className="text-xs text-gray-400 capitalize">{post.category.replace('-', ' ')}</span>
                    </div>
                    {post.locationName && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {post.locationName}
                      </p>
                    )}
                    <h2 className="text-lg font-bold text-gray-900 mt-2">{post.title}</h2>
                    <p className="text-gray-600 mt-1 text-sm">{post.excerpt}</p>
                    {post.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {post.images.map((img, i) => (
                          <img key={i} src={img} alt="" className="rounded-xl aspect-video object-cover" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {post.likeCount}
                  </button>
                  <button
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {post.replyCount} replies
                  </button>
                </div>

                {expandedPost === post.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {post.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-2 text-sm">
                        <span className="font-medium text-gray-900">{reply.authorName}:</span>
                        <span className="text-gray-600">{reply.content}</span>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => handleReply(post.id)}
                        className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {showNewPost && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-gray-900">New post</h2>
              <button onClick={() => setShowNewPost(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreatePost} className="p-4 space-y-4">
              <select
                value={newPost.category}
                onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              >
                {COMMUNITY_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <input
                required
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                placeholder="Title"
                className="w-full border border-gray-200 rounded-xl px-3 py-2"
              />
              <textarea
                required
                rows={4}
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                placeholder="Share your question, trip report, or tip..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2"
              />
              <input
                value={newPost.locationId}
                onChange={(e) => setNewPost({ ...newPost, locationId: e.target.value })}
                placeholder="Location ID (optional — link to a trail/camp)"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
              {(newPost.category === 'photos' || newPost.category === 'trip-reports') && (
                <ImageUpload
                  images={newPost.images}
                  onChange={(urls) => setNewPost({ ...newPost, images: urls })}
                  keyPrefix="community"
                  kind="community"
                  max={6}
                  label="Photos"
                />
              )}
              <p className="text-xs text-gray-500">
                Tip: open a <Link to="/discovery" className="text-emerald-600">location page</Link> and paste its ID to anchor your post.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitting ? 'Posting…' : 'Publish'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
