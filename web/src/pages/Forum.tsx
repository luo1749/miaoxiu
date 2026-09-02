import { useEffect, useState } from 'react';
import { useI18n } from "../i18n";
import { api } from '../api';
import { useAuth } from '../auth';
import {
  MessageSquare, Heart, Send,
  MessageCircle, Share2, Bookmark,
  X, Loader2,
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
        images: [],
      });
      toast.success('发帖成功，审核通过后将显示');
      setNewTitle('');
      setNewContent('');
      setNewTags('');
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

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    return Math.floor(diff / 86400000) + '天前';
  };

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
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className="px-4 py-2 rounded-lg text-xs transition-all shrink-0"
              style={{
                backgroundColor: activeTag === tag ? '#2441A9' : 'rgba(255,255,255,0.02)',
                color: activeTag === tag ? '#F0EDE0' : 'rgba(240,237,224,0.5)',
                border: `1px solid ${activeTag === tag ? '#2441A9' : 'rgba(240,237,224,0.06)'}`,
              }}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="text-center py-20 text-[#F0EDE0] opacity-50">
            <Loader2 size={32} className="animate-spin mx-auto mb-4" />
            加载中...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" style={{ color: '#F0EDE0' }} />
            <p className="text-[#F0EDE0] opacity-50">暂无帖子，快来发布第一条吧</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post, idx) => (
              <div
                key={post.id}
                className="p-5 rounded-xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={post.author?.avatar || 'images/pattern-1.jpg'}
                    alt={post.author?.name || '用户'}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#F0EDE0] font-medium text-sm">{post.author?.name || '匿名用户'}</span>
                      <span className="text-[10px] text-[#F0EDE0] opacity-30">{timeAgo(post.created_at)}</span>
                    </div>
                    <h3 className="text-[#F0EDE0] font-bold text-base mb-2">{post.title}</h3>
                    <p className="serif-text text-[#F0EDE0] opacity-50 text-sm leading-relaxed mb-3">{post.content}</p>

                    {post.images.length > 0 && (
                      <div className="flex gap-2 mb-3">
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
                      <button className="flex items-center gap-1 text-xs" style={{ color: 'rgba(240,237,224,0.4)' }}>
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

