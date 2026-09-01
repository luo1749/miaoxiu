import { useState, useRef } from 'react';
import { useI18n } from "../i18n";
import { useAppStore } from '../store';
import { api } from '../api';
import {
  Sparkles, Upload, Download, ThumbsUp, ThumbsDown,
  RefreshCw, Wand2, Info, X, Cpu, ChevronRight,
  Image as ImageIcon, Shield,
} from 'lucide-react';

const STYLES = [
  { key: 'miaoxiu', label: '苗绣风格', desc: '精细刺绣纹理，几何对称' },
  { key: 'laran', label: '蜡染风格', desc: '冰裂纹效果，蓝白主调' },
  { key: 'fusion', label: '融合风格', desc: '传统纹样 + 现代抽象' },
];

const COLORS = [
  { key: 'indigo', label: '靛蓝', hex: '#2441A9' },
  { key: 'vermilion', label: '朱红', hex: '#E84A3A' },
  { key: 'darkgreen', label: '墨绿', hex: '#1B4D3E' },
  { key: 'bone', label: '骨白', hex: '#F0EDE0' },
  { key: 'golden', label: '鎏金', hex: '#C8913A' },
  { key: 'purple', label: '紫绛', hex: '#5B2C6F' },
];

const MOCK_RESULTS = [
  {
    url: 'images/pattern-1.jpg',
    elements: ['蝴蝶', '花卉', '几何对称'],
    meaning: '蝴蝶妈妈是苗族创世神话中的始祖，象征生命起源。此纹样以蝴蝶为核心，周围环绕花卉与几何图案，体现苗族对自然万物的崇拜。',
    code: 'PTN-GEN-001',
  },
  {
    url: 'images/pattern-3.jpg',
    elements: ['龙纹', '水波纹', '云雷纹'],
    meaning: '苗族龙纹是水牛、鱼、蛇的复合体，象征丰收与力量。与水波纹结合，寓意风调雨顺、五谷丰登。',
    code: 'PTN-GEN-002',
  },
  {
    url: 'images/pattern-5.jpg',
    elements: ['铜鼓', '太阳芒', '蛙纹'],
    meaning: '铜鼓纹是苗族最重要的礼器纹样，同心圆结构象征宇宙秩序，太阳芒代表光明与温暖，蛙纹寓意繁衍生息。',
    code: 'PTN-GEN-003',
  },
  {
    url: 'images/pattern-9.jpg',
    elements: ['牡丹', '藤蔓', '鸟纹'],
    meaning: '花卉刺绣中的牡丹象征富贵吉祥，藤蔓代表生命绵延，鸟纹则是苗族祖先的灵魂使者，三者结合寓意幸福美满。',
    code: 'PTN-GEN-004',
  },
];

export default function AIGenerator() {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('miaoxiu');
  const [selectedColors, setSelectedColors] = useState<string[]>(['indigo', 'vermilion']);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<typeof MOCK_RESULTS>([]);
  const [selectedResult, setSelectedResult] = useState<number | null>(null);
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [feedback, setFeedback] = useState<Record<string, boolean | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addGeneratedImage, saveImage } = useAppStore();

  const toggleColor = (key: string) => {
    setSelectedColors((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && mode === 'text') return;
    setGenerating(true);
    try {
      const generated = await api.ai.generate({
        prompt: prompt || t('aig.mode_image'),
        style: selectedStyle,
        colors: selectedColors,
        batch_size: 4,
        mode,
      });
      const mapped = generated.map((g: any) => ({
        url: g.image_url,
        elements: g.elements || ['几何花卉', '传统纹样'],
        meaning: g.meaning || '融合苗族传统元素的原创纹样。',
        code: String(g.id).slice(0, 12),
      }));
      setResults(mapped);
      generated.forEach((g: any) => {
        addGeneratedImage({
          id: String(g.id),
          url: g.image_url,
          prompt: prompt || t('aig.mode_image'),
          style: selectedStyle,
          elements: g.elements || [],
          meaning: g.meaning || '',
          timestamp: Date.now(),
          likes: g.likes || 0,
          liked: null,
        });
      });
    } catch (err) {
      // 后端不可用或生成失败时降级为本地模拟
      const shuffled = [...MOCK_RESULTS].sort(() => Math.random() - 0.5).slice(0, 4);
      setResults(shuffled);
      shuffled.forEach((r) => {
        addGeneratedImage({
          id: r.code,
          url: r.url,
          prompt: prompt || t('aig.mode_image'),
          style: selectedStyle,
          elements: r.elements,
          meaning: r.meaning,
          timestamp: Date.now(),
          likes: 0,
          liked: null,
        });
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (result: typeof MOCK_RESULTS[0]) => {
    saveImage({
      id: result.code,
      url: result.url,
      prompt,
      style: selectedStyle,
      elements: result.elements,
      meaning: result.meaning,
      timestamp: Date.now(),
      likes: 0,
      liked: null,
    });
  };

  return (
    <div style={{ backgroundColor: '#0B0E14', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles size={24} style={{ color: '#E84A3A' }} />
            <span className="text-sm font-medium tracking-widest uppercase" style={{ color: '#E84A3A' }}>
              {t("aig.label")}
            </span>
          </div>
          <h1 className="font-bold text-[#F0EDE0]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
            {t("aig.title")}
          </h1>
          <p className="serif-text text-[#F0EDE0] opacity-50 mt-2 max-w-xl">
            {t("aig.desc")}
          </p>
        </div>

        {/* Model info badge */}
        <div
          className="flex items-center gap-4 px-4 py-3 rounded-lg mb-8 text-xs"
          style={{ backgroundColor: 'rgba(36, 65, 169, 0.1)', border: '1px solid rgba(36,65,169,0.2)' }}
        >
          <div className="flex items-center gap-2">
            <Cpu size={14} style={{ color: '#2441A9' }} />
            <span className="text-[#F0EDE0] opacity-70">{t("aig.model")}: Stable Diffusion + LoRA 铜仁苗绣 v3.2</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <RefreshCw size={14} style={{ color: '#2441A9' }} />
            <span className="text-[#F0EDE0] opacity-70">{t("aig.update")}: 2024-05-15</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <Shield size={14} style={{ color: '#2441A9' }} />
            <span className="text-[#F0EDE0] opacity-70">CC BY-NC 4.0 {t("aig.license")}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-4">
            {/* Mode toggle */}
            <div className="flex mb-6 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(240,237,224,0.1)' }}>
              <button
                onClick={() => setMode('text')}
                className="flex-1 py-3 text-sm font-medium transition-all"
                style={{
                  backgroundColor: mode === 'text' ? '#2441A9' : 'transparent',
                  color: mode === 'text' ? '#F0EDE0' : 'rgba(240,237,224,0.5)',
                }}
              >
                <Wand2 size={14} className="inline mr-2" />
                {t("aig.mode_text")}
              </button>
              <button
                onClick={() => setMode('image')}
                className="flex-1 py-3 text-sm font-medium transition-all"
                style={{
                  backgroundColor: mode === 'image' ? '#2441A9' : 'transparent',
                  color: mode === 'image' ? '#F0EDE0' : 'rgba(240,237,224,0.5)',
                }}
              >
                <ImageIcon size={14} className="inline mr-2" />
                {t("aig.mode_image")}
              </button>
            </div>

            {/* Prompt input */}
            <div className="mb-6">
              <label className="text-xs text-[#F0EDE0] opacity-50 mb-2 block">{t("aig.prompt_label")}</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'text' ? '描述你想要的纹样，如：苗绣风格的蝴蝶妈妈，几何对称，红蓝配色' : '描述风格迁移方向...'}
                className="w-full p-4 rounded-lg text-sm text-[#F0EDE0] resize-none"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(240,237,224,0.1)',
                  minHeight: '120px',
                }}
              />
            </div>

            {/* Image upload for img2img */}
            {mode === 'image' && (
              <div className="mb-6">
                <label className="text-xs text-[#F0EDE0] opacity-50 mb-2 block">{t("aig.ref_label")}</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
                {uploadedImage ? (
                  <div className="relative rounded-lg overflow-hidden" style={{ border: '1px solid rgba(240,237,224,0.1)' }}>
                    <img src={uploadedImage} alt="Uploaded" className="w-full h-40 object-cover" />
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(11,14,20,0.7)' }}
                    >
                      <X size={12} className="text-[#F0EDE0]" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 rounded-lg border border-dashed flex flex-col items-center gap-2 transition-all hover:bg-white/5"
                    style={{ borderColor: 'rgba(240,237,224,0.15)' }}
                  >
                    <Upload size={24} className="text-[#F0EDE0] opacity-30" />
                    <span className="text-xs text-[#F0EDE0] opacity-40">点击上传{t("aig.ref_label")}</span>
                  </button>
                )}
              </div>
            )}

            {/* Style selection */}
            <div className="mb-6">
              <label className="text-xs text-[#F0EDE0] opacity-50 mb-2 block">{t("aig.style_label")}</label>
              <div className="space-y-2">
                {STYLES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSelectedStyle(s.key)}
                    className="w-full text-left p-3 rounded-lg transition-all flex items-center gap-3"
                    style={{
                      backgroundColor: selectedStyle === s.key ? 'rgba(36,65,169,0.2)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${selectedStyle === s.key ? '#2441A9' : 'rgba(240,237,224,0.06)'}`,
                    }}
                  >
                    <ChevronRight
                      size={14}
                      style={{ color: selectedStyle === s.key ? '#2441A9' : 'rgba(240,237,224,0.3)' }}
                    />
                    <div>
                      <div className="text-[#F0EDE0] text-sm font-medium">{s.label}</div>
                      <div className="serif-text text-[#F0EDE0] opacity-40 text-xs">{s.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color selection */}
            <div className="mb-6">
              <label className="text-xs text-[#F0EDE0] opacity-50 mb-2 block">{t("aig.color_label")}</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => toggleColor(c.key)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all"
                    style={{
                      backgroundColor: selectedColors.includes(c.key) ? c.hex + '20' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${selectedColors.includes(c.key) ? c.hex : 'rgba(240,237,224,0.06)'}`,
                      color: selectedColors.includes(c.key) ? '#F0EDE0' : 'rgba(240,237,224,0.4)',
                    }}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating || (!prompt.trim() && mode === 'text')}
              className="w-full py-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{
                backgroundColor: '#E84A3A',
                color: '#F0EDE0',
              }}
            >
              {generating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  {t("aig.generating")}
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  {t("aig.generate")}
                </>
              )}
            </button>

            {/* License note */}
            <p className="serif-text text-[#F0EDE0] opacity-30 text-xs mt-4 text-center leading-relaxed">
              生成内容采用 CC BY-NC 4.0 协议，鼓励非商业使用。
              商业合作请联系团队获取授权。
            </p>
          </div>

          {/* Output Panel */}
          <div className="lg:col-span-8">
            {results.length === 0 && !generating && (
              <div
                className="h-full min-h-[500px] rounded-xl flex flex-col items-center justify-center"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.01)',
                  border: '1px dashed rgba(240,237,224,0.08)',
                }}
              >
                <Wand2 size={48} className="text-[#F0EDE0] opacity-10 mb-4" />
                <p className="text-[#F0EDE0] opacity-30 text-sm">输入{t("aig.prompt_label")}，点击生成按钮开始创作</p>
              </div>
            )}

            {generating && (
              <div
                className="h-full min-h-[500px] rounded-xl flex flex-col items-center justify-center gap-4"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(240,237,224,0.06)',
                }}
              >
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-2 border-t-[#2441A9] border-r-transparent border-b-[#E84A3A] border-l-transparent animate-spin" />
                  <Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#F0EDE0] opacity-30" />
                </div>
                <p className="text-[#F0EDE0] opacity-50 text-sm">{t("aig.wait")}</p>
                <p className="serif-text text-[#F0EDE0] opacity-30 text-xs">{t("aig.eta")}</p>
              </div>
            )}

            {results.length > 0 && !generating && (
              <div>
                {/* Results grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {results.map((result, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden cursor-pointer"
                      style={{ border: '1px solid rgba(240,237,224,0.08)' }}
                      onClick={() => setSelectedResult(idx)}
                    >
                      <img src={result.url} alt={result.code} className="w-full aspect-square object-cover" />
                      <div
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFeedback((f) => ({ ...f, [result.code]: f[result.code] === true ? null : true }));
                            }}
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: feedback[result.code] === true ? '#2441A9' : 'rgba(255,255,255,0.2)' }}
                          >
                            <ThumbsUp size={16} className="text-[#F0EDE0]" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFeedback((f) => ({ ...f, [result.code]: f[result.code] === false ? null : false }));
                            }}
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: feedback[result.code] === false ? '#E84A3A' : 'rgba(255,255,255,0.2)' }}
                          >
                            <ThumbsDown size={16} className="text-[#F0EDE0]" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSave(result);
                            }}
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                          >
                            <Download size={16} className="text-[#F0EDE0]" />
                          </button>
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(11,14,20,0.7)', color: '#F0EDE0' }}>
                          {result.code}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cultural analysis */}
                {selectedResult !== null && (
                  <div
                    className="rounded-xl p-6"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(240,237,224,0.08)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Info size={16} style={{ color: '#2441A9' }} />
                      <h3 className="text-[#F0EDE0] font-bold text-sm">{t("aig.culture")}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {results[selectedResult].elements.map((el) => (
                        <span
                          key={el}
                          className="text-xs px-3 py-1 rounded-full"
                          style={{ backgroundColor: 'rgba(232,74,58,0.15)', color: '#E84A3A' }}
                        >
                          {el}
                        </span>
                      ))}
                    </div>
                    <p className="serif-text text-[#F0EDE0] opacity-60 text-sm leading-relaxed">
                      {results[selectedResult].meaning}
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs text-[#F0EDE0] opacity-30 flex items-center gap-1">
                        <Shield size={12} />
                        CC BY-NC 4.0 · 非商业使用
                      </span>
                      <button
                        onClick={() => handleSave(results[selectedResult])}
                        className="text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all hover:opacity-80"
                        style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}
                      >
                        <Download size={12} />
                        {t("aig.save")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
