import { useEffect, useRef, useState } from 'react';
import { useI18n } from "../i18n";
import { api } from '../api';
import { useAuth } from '../auth';
import {
  MessageSquare, Heart, Send,
  MessageCircle, Share2, Bookmark,
  X, Loader2, ImagePlus,
} from 'lucide-react';
import { toast } from 'sonner';

const TAGS = ['全部', 'AI生成', '传统技艺', 'AR体验', '创作分享', '研学日记', '求助问答', '活动招募'];

interface BackendPost {
  id: string;
  title: string;
  content: string;
  images: string[];
  tags: string[];
  likes: number;
  comments_count: number;
  status: string;
  created_at: string;
  author?: {
    name: string;
    avatar: string;
  } | null;
}

interface ForumComment {
  id: string;
  content: string;
  created_at: string;
  author?: {
    name: string;
    avatar: string;
  } | null;
}

interface ForumPost extends BackendPost {
  liked: boolean;
}

export default function Forum() {
  const { t } = useI18n();
  const { isLoggedIn } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('全部');
  const [showNewPost, setShowNewPost] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newImages, setNewImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, ForumComment[]>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await api.forum.posts({ status: 'approved' });
      setPosts(
        (data || []).map((p: BackendPost) => ({
          ...p,
          liked: false,
        }))
      );
    } catch (e: any) {
      toast.error(e.message || '帖子加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = activeTag === '全部'
    ? posts
    : posts.filter((p) => p.tags.includes(activeTag));

  const handleImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const res = await api.uploads.image(files[i]);
        urls.push(res.url);
      }
      setNewImages((prev) => [...prev, ...urls]);
    } catch (e: any) {
      toast.error(e.message || '图片上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      toast.error('请先登录后发帖');
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) return;
    setSubmitting(true);
    try {
      const tags = newTags.split(/[,，]/).filter(Boolean).length > 0
        ? newTags.split(/[,，]/).map((t) => t.trim()).filter(Boolean)
        : ['创作分享'];
      await api.forum.createPost({
        title: newTitle.trim(),
        content: newContent.trim(),
        tags,
        images: newImages,
      });
      toast.success('发帖成功，审核通过后将显示');
      setNewTitle('');
      setNewContent('');
      setNewTags('');
      setNewImages([]);
      setShowNewPost(false);
      fetchPosts();
    } catch (e: any) {
      toast.error(e.message || '发帖失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (post: ForumPost, index: number) => {
    if (!isLoggedIn) {
      toast.error('请先登录后点赞');
      return;
    }
    try {
      await api.forum.like(post.id);
      setPosts((prev) =>
        prev.map((p, i) => {
          if (i !== index) return p;
          return {
            ...p,
            liked: !p.liked,
            likes: p.liked ? p.likes - 1 : p.likes + 1,
          };
        })
      );
    } catch (e: any) {
      toast.error(e.message || '点赞失败');
    }
  };

  const toggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }
    setExpandedPostId(postId);
    if (!commentsMap[postId]) {
      try {
        const data = await api.forum.comments(postId);
        setCommentsMap((prev) => ({ ...prev, [postId]: data || [] }));
      } catch (e: any) {
        toast.error(e.message || '评论加载失败');
      }
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    if (!isLoggedIn) {
      toast.error('请先登录后评论');
      return;
    }
    const content = (commentDraft[postId] || '').trim();
    if (!content) return;
    setCommentLoading((prev) => ({ ...prev, [postId]: true }));
    try {
      const comment = await api.forum.createComment(postId, content);
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), comment],
      }));
      setCommentDraft((prev) => ({ ...prev, [postId]: '' }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
        )
      );
    } catch (e: any) {
      toast.error(e.message || '评论失败');
    } finally {
      setCommentLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    return Math.floor(diff / 86400000) + '天前';
  };

  const avatarUrl = (url?: string | null) =>
    url && url.startsWith('http') ? url : (url || '/images/pattern-5.jpg');

  return (
    <div style={{ backgroundColor: '#0B0E14', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <MessageSquare size={24} style={{ color: '#E84A3A' }} />
              <span className="text-sm font-medium tracking-widest uppercase" style={{ color: '#E84A3A' }}>
                {t("forum.label")}
              </span>
            </div>
            <h1 className="font-bold text-[#F0EDE0]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              {t("forum.title")}
            </h1>
            <p className="serif-text text-[#F0EDE0] opacity-50 mt-2">
              {t("forum.desc")}
            </p>
          </div>
          <button
            onClick={() => {
              if (!isLoggedIn) {
                toast.error('请先登录后发帖');
                return;
              }
              setShowNewPost(true);
            }}
            className="px-5 py-3 rounded-lg text-sm font-bold flex items-center gap-2"
            style={{ backgroundColor: '#E84A3A', color: '#F0EDE0' }}
          >
            <Send size={16} />
            {t("forum.new_post")}
          </button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className="px-4 py-2 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: activeTag === tag ? '#2441A9' : 'rgba(255,255,255,0.03)',
                color: activeTag === tag ? '#F0EDE0' : 'rgba(240,237,224,0.5)',
                border: '1px solid',
                borderColor: activeTag === tag ? 'rgba(36,65,169,0.5)' : 'rgba(240,237,224,0.06)',
              }}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin" style={{ color: '#2441A9' }} />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare size={48} className="mx-auto mb-4" style={{ color: 'rgba(240,237,224,0.1)' }} />
            <p className="text-[#F0EDE0] opacity-40 text-sm">暂无帖子，来发布第一条吧</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post, idx) => (
              <div
                key={post.id}
                className="rounded-2xl p-6 transition-all"
                style={{
                  backgroundColor: 'rgba(240,237,224,0.03)',
                  border: '1px solid rgba(240,237,224,0.06)',
                }}
              >
                <div className="flex gap-4">
                  <img
                    src={avatarUrl(post.author?.avatar)}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[#F0EDE0]">
                        {post.author?.name || '匿名用户'}
                      </span>
                      <span className="text-[10px] text-[#F0EDE0] opacity-30">{timeAgo(post.created_at)}</span>
                    </div>
                    <h3 className="text-[#F0EDE0] font-bold text-base mb-2">{post.title}</h3>
                    <p className="serif-text text-[#F0EDE0] opacity-50 text-sm leading-relaxed mb-3">{post.content}</p>

                    {post.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.images.map((img, i) => (
                          <img key={i} src={img} alt="" className="w-24 h-24 rounded-lg object-cover" />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-1 mb-3">
                      {post.tags.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(36,65,169,0.15)', color: '#2441A9' }}>
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post, idx)}
                        className="flex items-center gap-1 text-xs transition-all"
                        style={{ color: post.liked ? '#E84A3A' : 'rgba(240,237,224,0.4)' }}
                      >
                        <Heart size={14} fill={post.liked ? '#E84A3A' : 'none'} />
                        {post.likes}
                      </button>
                      <button
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1 text-xs"
                        style={{ color: expandedPostId === post.id ? '#2441A9' : 'rgba(240,237,224,0.4)' }}
                      >
                        <MessageCircle size={14} />
                        {post.comments_count}
                      </button>
                      <button className="flex items-center gap-1 text-xs" style={{ color: 'rgba(240,237,224,0.4)' }}>
                        <Share2 size={14} />
                        分享
                      </button>
                      <button className="flex items-center gap-1 text-xs" style={{ color: 'rgba(240,237,224,0.4)' }}>
                        <Bookmark size={14} />
                        收藏
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comments */}
                {expandedPostId === post.id && (
                  <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(240,237,224,0.06)' }}>
                    <div className="space-y-3 mb-4">
                      {(commentsMap[post.id] || []).length === 0 ? (
                        <p className="text-xs text-[#F0EDE0] opacity-30">暂无评论，来说两句吧</p>
                      ) : (
                        (commentsMap[post.id] || []).map((c) => (
                          <div key={c.id} className="flex gap-3">
                            <img
                              src={avatarUrl(c.author?.avatar)}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-medium text-[#F0EDE0]">{c.author?.name || '匿名用户'}</span>
                                <span className="text-[10px] text-[#F0EDE0] opacity-30">{timeAgo(c.created_at)}</span>
                              </div>
                              <p className="text-sm text-[#F0EDE0] opacity-60">{c.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {isLoggedIn ? (
                      <div className="flex gap-2">
                        <input
                          value={commentDraft[post.id] || ''}
                          onChange={(e) => setCommentDraft((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(post.id); }}
                          placeholder="写下你的评论..."
                          className="flex-1 px-4 py-2 rounded-lg text-sm text-[#F0EDE0]"
                          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,237,224,0.1)' }}
                        />
                        <button
                          onClick={() => handleCommentSubmit(post.id)}
                          disabled={commentLoading[post.id]}
                          className="px-4 py-2 rounded-lg text-xs font-bold"
                          style={{ backgroundColor: '#2441A9', color: '#F0EDE0', opacity: commentLoading[post.id] ? 0.7 : 1 }}
                        >
                          {commentLoading[post.id] ? <Loader2 size={14} className="animate-spin" /> : '发送'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-[#F0EDE0] opacity-40">登录后即可参与评论</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* New Post Modal */}
        {showNewPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(11,14,20,0.85)', backdropFilter: 'blur(12px)' }} onClick={() => setShowNewPost(false)}>
            <div
              className="relative w-full max-w-lg rounded-2xl p-6"
              style={{ backgroundColor: '#0B0E14', border: '1px solid rgba(240,237,224,0.1)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowNewPost(false)} className="absolute top-4 right-4"><X size={16} className="text-[#F0EDE0] opacity-40" /></button>
              <h3 className="text-[#F0EDE0] font-bold text-lg mb-4">{t("forum.new_post")}</h3>
              <div className="space-y-4">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t("forum.title_placeholder")}
                  className="w-full px-4 py-3 rounded-lg text-sm text-[#F0EDE0]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,237,224,0.1)' }}
                />
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={t("forum.content_placeholder")}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg text-sm text-[#F0EDE0] resize-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,237,224,0.1)' }}
                />
                <input
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder={t("forum.tags_placeholder")}
                  className="w-full px-4 py-3 rounded-lg text-sm text-[#F0EDE0]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,237,224,0.1)' }}
                />

                {/* Image upload */}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={fileInputRef}
                    onChange={(e) => handleImageSelect(e.target.files)}
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newImages.map((img, i) => (
                      <div key={i} className="relative">
                        <img src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: '#E84A3A' }}
                        >
                          <X size={10} className="text-white" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-16 h-16 rounded-lg flex flex-col items-center justify-center text-xs"
                      style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(240,237,224,0.2)', color: 'rgba(240,237,224,0.5)' }}
                    >
                      {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                      <span className="mt-1">{uploading ? '上传中' : '图片'}</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#E84A3A', color: '#F0EDE0', opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {t("forum.submit")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
