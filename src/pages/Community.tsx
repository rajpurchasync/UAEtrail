import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MessageSquare, ThumbsUp, Plus, X, Send, MapPin } from 'lucide-react';
import { PostDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { ImageUpload } from '../components/ui/ImageUpload';
import { COMMUNITY_CATEGORIES } from '../config/platform';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { FilterChips } from '../components/mobile/FilterChips';
import { FloatingActionButton } from '../components/mobile/FloatingActionButton';
import { PAGE_BANNERS } from '../config/pageBanners';
import { PageMeta } from '../components/seo/PageMeta';
import { GlassCard } from '../components/mobile/GlassCard';
import { MembershipTierBadge } from '../components/ui/MembershipTierBadge';
import { TrailPointsPromoBanner } from '../components/rewards';

export const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'questions', locationId: '', images: [] as string[] });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  const toggleExpanded = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }
    setExpandedPost(postId);
    try {
      const res = await api.getPost(postId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? res.data : p)));
    } catch {
      /* keep list version */
    }
  };

  const handleReply = async (postId: string) => {
    if (!user) {
      navigate('/signin');
      return;
    }
    const text = replyTexts[postId]?.trim() ?? '';
    if (!text) return;
    setActionError(null);
    try {
      await api.replyToPost(postId, text);
      setReplyTexts((prev) => ({ ...prev, [postId]: '' }));
      const res = await api.getPost(postId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? res.data : p)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to post reply');
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      navigate('/signin');
      return;
    }
    setActionError(null);
    try {
      await api.togglePostLike(postId);
      loadPosts();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to like post');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/signin');
      return;
    }
    setFormError(null);
    if (newPost.title.trim().length < 5) {
      setFormError('Title must be at least 5 characters.');
      return;
    }
    if (newPost.content.trim().length < 10) {
      setFormError('Content must be at least 10 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createPost({
        category: newPost.category,
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        locationId: newPost.locationId || undefined,
        images: newPost.images
      });
      setShowNewPost(false);
      setNewPost({ title: '', content: '', category: 'questions', locationId: '', images: [] });
      loadPosts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryTabs = [
    { key: 'all', label: 'All' },
    ...COMMUNITY_CATEGORIES.map((cat) => ({ key: cat.id, label: cat.label })),
  ];

  return (
    <>
      <PageMeta
        title="Outdoor community"
        description="Ask questions, share trip reports, and get tips from hikers and campers across the UAE."
        path="/community"
      />
    <ConsumerShell
      layout="tab"
      title="Community"
      maxWidth="4xl"
      banner={{ src: PAGE_BANNERS.community, alt: 'Friends hiking together' }}
      toolbar={
        <>
          <form onSubmit={handleSearch} className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions..."
              className="glass-search"
            />
          </form>
          <FilterChips options={categoryTabs} value={selectedCategory} onChange={setSelectedCategory} />
        </>
      }
    >
      <FloatingActionButton
        icon={<Plus className="w-6 h-6" strokeWidth={2.25} />}
        label="New post"
        onClick={() => (user ? setShowNewPost(true) : navigate('/signin'))}
      />
      <div className="space-y-4 animate-fade-up pb-20 md:pb-4">
        <TrailPointsPromoBanner variant="community" />
        {actionError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{actionError}</p>
        )}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
          </div>
        ) : posts.length === 0 ? (
          <GlassCard padding className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600 font-medium">No posts yet. Be the first to ask a question!</p>
          </GlassCard>
        ) : (
          posts.map((post) => (
            <GlassCard key={post.id} padding className="overflow-hidden">
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
                      {post.authorMembershipTier && (
                        <MembershipTierBadge
                          tierKey={post.authorMembershipTier.key}
                          name={post.authorMembershipTier.name}
                          emoji={post.authorMembershipTier.emoji}
                        />
                      )}
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

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => handleLike(post.id)}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-sm text-neutral-500 active:text-emerald-600"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {post.likeCount}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(post.id)}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-sm text-neutral-500 active:text-emerald-600"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {post.replyCount} replies
                  </button>
                </div>

                {expandedPost === post.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {post.replies.map((reply) => (
                      <div key={reply.id} className="flex flex-wrap gap-x-2 gap-y-0.5 text-sm">
                        <span className="font-medium text-gray-900 inline-flex items-center gap-1.5">
                          {reply.authorName}
                          {reply.authorMembershipTier && (
                            <MembershipTierBadge
                              tierKey={reply.authorMembershipTier.key}
                              name={reply.authorMembershipTier.name}
                              emoji={reply.authorMembershipTier.emoji}
                            />
                          )}
                        </span>
                        <span className="text-gray-600">{reply.content}</span>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        value={replyTexts[post.id] ?? ''}
                        onChange={(e) => setReplyTexts((prev) => ({ ...prev, [post.id]: e.target.value }))}
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
            </GlassCard>
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
              {formError && <p className="text-sm text-red-600">{formError}</p>}
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
              <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                Earn <strong>+20 Trail Points</strong> when you publish.
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
    </ConsumerShell>
    </>
  );
};
