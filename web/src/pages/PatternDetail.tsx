import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { api } from '../api';
import { ArrowLeft, BookOpen, Heart, Share2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Pattern {
  id: string;
  name: string;
  category: string;
  description: string;
  meaning: string;
  occasion: string;
  image_url: string;
  lineart_url?: string;
  ai_prompt: string;
  tags: string[];
  views: number;
  is_featured: boolean;
}

const CATEGORY_MAP: Record<string, string> = {
  plant: '植物纹',
  animal: '动物纹',
  geometry: '几何纹',
  mythology: '神话人物纹',
};

export default function PatternDetail() {
  const { id } = useParams<{ id: string }>();
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.patterns.get(id)
      .then((p) => { setPattern(p); document.title = `${p.name} · 纹样详情`; })
      .catch(() => toast.error('纹样加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-center py-40 text-[#F0EDE0] opacity-50">加载中...</div>;
  }

  if (!pattern) {
    return (
      <div className="text-center py-40 text-[#F0EDE0]">
        <p className="opacity-50 mb-4">纹样不存在或已下架</p>
        <Link to="/knowledge-graph" className="text-sm" style={{ color: '#E84A3A' }}>返回纹样库</Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0B0E14', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Link to="/knowledge-graph" className="inline-flex items-center gap-1 text-xs mb-6 opacity-50 hover:opacity-80" style={{ color: '#F0EDE0' }}>
          <ArrowLeft size={14} /> 返回纹样库
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(240,237,224,0.08)' }}>
            <img src={pattern.image_url} alt={pattern.name} className="w-full h-full object-cover" />
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(36,65,169,0.15)', color: '#F0EDE0' }}>
                {CATEGORY_MAP[pattern.category] || pattern.category}
              </span>
              {pattern.is_featured && (
                <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(232,74,58,0.15)', color: '#E84A3A' }}>
                  精选纹样
                </span>
              )}
            </div>

            <h1 className="font-bold text-[#F0EDE0] mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              {pattern.name}
            </h1>

            <div className="space-y-4 mb-8">
              <div>
                <h3 className="text-sm font-bold text-[#F0EDE0] mb-1 flex items-center gap-2">
                  <BookOpen size={16} style={{ color: '#E84A3A' }} /> 纹样简介
                </h3>
                <p className="text-sm opacity-70 leading-relaxed" style={{ color: '#F0EDE0' }}>{pattern.description}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F0EDE0] mb-1 flex items-center gap-2">
                  <Heart size={16} style={{ color: '#E84A3A' }} /> 文化寓意
                </h3>
                <p className="text-sm opacity-70 leading-relaxed" style={{ color: '#F0EDE0' }}>{pattern.meaning}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F0EDE0] mb-1">使用场合</h3>
                <p className="text-sm opacity-70" style={{ color: '#F0EDE0' }}>{pattern.occasion}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {pattern.tags.map((tag) => (
                <span key={tag} className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(240,237,224,0.06)', color: '#F0EDE0' }}>
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex gap-3">
              <Link
                to="/ai-generator"
                className="px-5 py-3 rounded-lg text-sm font-bold flex items-center gap-2"
                style={{ backgroundColor: '#E84A3A', color: '#F0EDE0' }}
              >
                <Sparkles size={16} /> 用 AI 再创作
              </Link>
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('链接已复制'); }}
                className="px-5 py-3 rounded-lg text-sm font-bold flex items-center gap-2"
                style={{ backgroundColor: 'rgba(240,237,224,0.06)', color: '#F0EDE0', border: '1px solid rgba(240,237,224,0.1)' }}
              >
                <Share2 size={16} /> 分享
              </button>
            </div>
          </div>
        </div>

        {/* AI Prompt */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(36,65,169,0.05)', border: '1px solid rgba(36,65,169,0.15)' }}>
          <h3 className="text-sm font-bold text-[#F0EDE0] mb-3 flex items-center gap-2">
            <Sparkles size={16} style={{ color: '#2441A9' }} /> AI 生成参考 Prompt
          </h3>
          <code className="block text-xs p-4 rounded-lg" style={{ backgroundColor: 'rgba(11,14,20,0.5)', color: '#F0EDE0', opacity: 0.8 }}>
            {pattern.ai_prompt}
          </code>
        </div>
      </div>
    </div>
  );
}
