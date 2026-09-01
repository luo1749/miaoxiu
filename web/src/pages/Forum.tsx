import { useState } from 'react';
import { useI18n } from "../i18n";
import { useAppStore } from '../store';
import type { ForumPost } from '../store';
import {
  MessageSquare, Heart, Send,
  MessageCircle, Share2, Bookmark,
  X,
} from 'lucide-react';

const TAGS = ['全部', 'AI生成', '传统技艺', 'AR体验', '创作分享', '研学日记', '求助问答', '活动招募'];

export default function Forum() {
  const { t } = useI18n();
  const { forumPosts, toggleForumLike, addForumPost } = useAppStore();
  const [activeTag, setActiveTag] = useState('全部');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  const filteredPosts = activeTag === '全部'
    ? forumPosts
    : forumPosts.filter((p) => p.tags.includes(activeTag));

  const handleSubmit = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const post: ForumPost = {
      id: Date.now().toString(),
      author: '创意探索者',
      avatar: 'images/pattern-5.jpg',
      title: newTitle,
      content: newContent,
      images: [],
      likes: 0,
      comments: 0,
      tags: newTags.split(/[,，]/).filter(Boolean).length > 0 ? newTags.split(/[,，]/) : ['创作分享'],
      timestamp: Date.now(),
      liked: false,
    };
    addForumPost(post);
    setNewTitle('');
    setNewContent('');
    setNewTags('');
    setShowNewPost(false);
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
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
            onClick={() => setShowNewPost(true)}
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
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="p-5 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}
            >
              <div className="flex items-start gap-3">
                <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#F0EDE0] font-medium text-sm">{post.author}</span>
                    <span className="text-[10px] text-[#F0EDE0] opacity-30">{timeAgo(post.timestamp)}</span>
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
                      onClick={() => toggleForumLike(post.id)}
                      className="flex items-center gap-1 text-xs transition-all"
                      style={{ color: post.liked ? '#E84A3A' : 'rgba(240,237,224,0.4)' }}
                    >
                      <Heart size={14} fill={post.liked ? '#E84A3A' : 'none'} />
                      {post.likes}
                    </button>
                    <button className="flex items-center gap-1 text-xs" style={{ color: 'rgba(240,237,224,0.4)' }}>
                      <MessageCircle size={14} />
                      {post.comments}
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
                  className="w-full py-3 rounded-lg text-sm font-bold"
                  style={{ backgroundColor: '#E84A3A', color: '#F0EDE0' }}
                >
                  <Send size={14} className="inline mr-2" />
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
