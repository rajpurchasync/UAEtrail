import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, MessageSquare, ThumbsUp, Plus, X, MapPin, CheckCircle2, Users } from 'lucide-react';
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
import { ReportContentButton } from '../components/ui/ReportContentDialog';
import { ChatComposeBar } from '../components/ui/ChatComposeBar';
import { EmojiPickerButton } from '../components/ui/EmojiPickerButton';
import { buildSignInRedirect } from '../utils/authReturnContext';

const linkPattern = /(?:https?:\/\/|www\.)\S+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:\/\S*)?/gi;
const phoneCandidatePattern = /\+?\d[\d\s().-]{6,}\d/g;

const sanitizeUserGeneratedText = (value: string): string => {
  const noLinks = value.replace(linkPattern, '[removed]');
  return noLinks.replace(phoneCandidatePattern, (match) => {
    const digitCount = match.replace(/\D/g, '').length;
    return digitCount >= 7 ? '[removed]' : match;
  });
};

export const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  const redirectToSignIn = (focusSelector?: string) => {
    const { href, from } = buildSignInRedirect(location, { focusSelector });
    navigate(href, { state: { from } });
  };

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
      redirectToSignIn(`[data-post-id="${postId}"]`);
      return;
    }
    const text = sanitizeUserGeneratedText(replyTexts[postId] ?? '').trim();
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
      redirectToSignIn(`[data-post-id="${postId}"]`);
      return;
    }
    setActionError(null);
    try {
      const res = await api.togglePostLike(postId);
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          const likedByMe = res.data.liked;
          const likeCount = likedByMe ? post.likeCount + 1 : Math.max(0, post.likeCount - 1);
          return { ...post, likedByMe, likeCount };
        })
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to like post');
    }
  };

  const handleReplyLike = async (postId: string, replyId: string) => {
    if (!user) {
      redirectToSignIn(`[data-reply-id="${replyId}"]`);
      return;
    }
    setActionError(null);
    try {
      const res = await api.toggleReplyLike(postId, replyId);
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            replies: post.replies.map((reply) => {
              if (reply.id !== replyId) return reply;
              const likedByMe = res.data.liked;
              const likeCount = likedByMe ? reply.likeCount + 1 : Math.max(0, reply.likeCount - 1);
              return { ...reply, likedByMe, likeCount };
            })
          };
        })
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to like comment');
    }
  };

  const handleAcceptReply = async (postId: string, replyId: string) => {
    if (!user) {
      redirectToSignIn(`[data-reply-id="${replyId}"]`);
      return;
    }
    setActionError(null);
    try {
      const res = await api.acceptPostReply(postId, replyId);
      setPosts((prev) => prev.map((post) => (post.id === postId ? res.data : post)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to accept comment');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      redirectToSignIn('[data-auth-focus="community-new-post"]');
      return;
    }
    setFormError(null);
    if (newPost.title.trim().length < 5) {
      setFormError('Title must be at least 5 characters.');
      return;
    }
    const sanitizedContent = sanitizeUserGeneratedText(newPost.content).trim();
    if (sanitizedContent.length < 10) {
      setFormError('Content must be at least 10 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createPost({
        category: newPost.category,
        title: newPost.title.trim(),
        content: sanitizedContent,
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

  const handleOpenCreateGroup = () => {
    const groupsCreatePath = '/groups?create=1&from=community';
    if (!user) {
      const params = new URLSearchParams({
        redirect: groupsCreatePath,
        focus: '[data-auth-focus="community-create-group"]',
      });
      navigate(`/signin?${params.toString()}`, { state: { from: groupsCreatePath } });
      return;
    }
    navigate(groupsCreatePath);
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
      journey={{ fallbackTo: '/', label: 'Home' }}
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
        data-auth-focus="community-new-post"
        icon={<Plus className="w-6 h-6" strokeWidth={2.25} />}
        label="New post"
        onClick={() => (user ? setShowNewPost(true) : redirectToSignIn('[data-auth-focus="community-new-post"]'))}
      />
      <div className="space-y-4 animate-fade-up pb-20 md:pb-4">
        <TrailPointsPromoBanner variant="community" />
        <GlassCard
          padding
          className="flex flex-col sm:flex-row sm:items-center gap-4"
          data-auth-focus="community-create-group"
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-blue-500/12 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900">Trail with your crew</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Create a private group, invite family or friends, and chat together on trips.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenCreateGroup}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              Create group
            </button>
            {user && (
              <Link
                to="/groups?from=community"
                className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                My groups
              </Link>
            )}
          </div>
        </GlassCard>
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
            <GlassCard key={post.id} padding className="overflow-hidden" data-post-id={post.id} tabIndex={-1}>
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
                    className={`inline-flex items-center gap-1.5 min-h-[44px] px-3 text-sm ${post.likedByMe ? 'text-emerald-600' : 'text-neutral-500 active:text-emerald-600'}`}
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
                  {user && post.authorId !== user.id && (
                    <ReportContentButton targetType="post" targetId={post.id} label="Report" className="ml-auto" />
                  )}
                </div>

                {expandedPost === post.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {post.replies.map((reply) => (
                      <div
                        key={reply.id}
                        data-reply-id={reply.id}
                        className={`rounded-xl border px-3 py-2 text-sm ${reply.isAccepted ? 'border-emerald-200 bg-emerald-50/60' : 'border-gray-100 bg-white'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
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
                              {reply.isAccepted && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Accepted
                                </span>
                              )}
                            </div>
                            <span className="block text-gray-600">{reply.content}</span>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleReplyLike(post.id, reply.id)}
                              className={`inline-flex items-center gap-1.5 min-h-[36px] px-2.5 text-xs font-medium rounded-full border ${reply.likedByMe ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-neutral-500 active:text-emerald-600'}`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              {reply.likeCount}
                            </button>
                            {user && post.authorId === user.id && (
                              <button
                                type="button"
                                onClick={() => handleAcceptReply(post.id, reply.id)}
                                className={`inline-flex items-center gap-1.5 min-h-[36px] px-2.5 text-xs font-medium rounded-full border ${reply.isAccepted ? 'border-emerald-200 bg-emerald-100 text-emerald-800' : 'border-gray-200 bg-white text-neutral-500 active:text-emerald-600'}`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {reply.isAccepted ? 'Accepted' : 'Accept'}
                              </button>
                            )}
                            {user && reply.authorId !== user.id && (
                              <ReportContentButton targetType="reply" targetId={reply.id} label="Report" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <ChatComposeBar
                      value={replyTexts[post.id] ?? ''}
                      onChange={(value) => setReplyTexts((prev) => ({ ...prev, [post.id]: value }))}
                      onSend={() => handleReply(post.id)}
                      placeholder="Write a reply..."
                      className="!border-0 !px-0 !pt-0"
                    />
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
              <div className="flex gap-2 items-end">
                <textarea
                  required
                  rows={4}
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Share your question, trip report, or tip..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 font-emoji"
                />
                <EmojiPickerButton
                  onPick={(emoji) => setNewPost((prev) => ({ ...prev, content: `${prev.content}${emoji}` }))}
                />
              </div>
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
                  preset="rectangle"
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
