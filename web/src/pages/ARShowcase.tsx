import { useI18n } from "../i18n";
import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Sparkles, Glasses, ArrowRight, Layers,
  Shirt, ScanLine, Palette,
  Cpu, Eye, Zap, Star,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const WORKFLOW_STEPS = [
  {
    num: '01',
    title: 'AI 纹样生成',
    desc: '输入自然语言描述，Stable Diffusion + LoRA 模型 instantly 生成具有铜仁苗族风格的原创纹样',
    icon: Sparkles,
    color: '#E84A3A',
    details: ['文生图：自然语言→高清纹样', '图生图：参考图+风格迁移', '文化解析：自动识别纹样元素与寓意'],
  },
  {
    num: '02',
    title: '纹样智能优化',
    desc: '基于用户反馈（点赞/点踩）持续微调模型，使生成结果更贴合传统审美',
    icon: Cpu,
    color: '#2441A9',
    details: ['用户偏好收集', '模型参数微调', '版本迭代管理'],
  },
  {
    num: '03',
    title: 'AR 实时预览',
    desc: '通过 WebAR 技术，将 AI 生成的纹样实时叠加到服饰、家居、虚拟模特上',
    icon: Glasses,
    color: '#C8913A',
    details: ['Three.js 3D 渲染引擎', '摄像头虚实融合', '多角度旋转预览'],
  },
  {
    num: '04',
    title: '一键下单定制',
    desc: '满意后可直接购买实体文创产品，或联系绣娘进行手工定制',
    icon: Zap,
    color: '#1B4D3E',
    details: ['绣娘手作/AI设计比例标注', '在线支付', '研学证书'],
  },
];

const EXAMPLES = [
  {
    title: '蝴蝶妈妈 · T恤印花',
    prompt: '苗绣风格的蝴蝶妈妈，几何对称，红蓝配色',
    pattern: 'images/pattern-3.jpg',
    preview: 'images/pattern-1.jpg',
    tags: ['AI生成', 'AR试穿', '服饰'],
  },
  {
    title: '铜鼓纹 · 帆布包',
    prompt: '铜鼓纹几何图案，同心圆结构，蓝白金配色',
    pattern: 'images/pattern-5.jpg',
    preview: 'images/pattern-4.jpg',
    tags: ['AI生成', 'AR家居', '箱包'],
  },
  {
    title: '龙纹图腾 · 围巾',
    prompt: '苗族龙纹图腾，融合水牛与鱼，红蓝绿配色',
    pattern: 'images/pattern-8.jpg',
    preview: 'images/pattern-2.jpg',
    tags: ['AI生成', 'AR试穿', '配饰'],
  },
  {
    title: '水波纹 · 抱枕套',
    prompt: '蜡染水波纹，流畅波浪线条，蓝白配色',
    pattern: 'images/pattern-6.jpg',
    preview: 'images/pattern-7.jpg',
    tags: ['AI生成', 'AR家居', '家居'],
  },
];

const FEATURES = [
  { icon: ScanLine, label: 'WebAR 零安装', desc: '浏览器即开即用，无需下载App' },
  { icon: Palette, label: 'AI 智能配色', desc: '6种传统苗族配色方案' },
  { icon: Eye, label: '实时预览', desc: 'Three.js 3D 实时渲染，<3秒加载' },
  { icon: Layers, label: '风格迁移', desc: '手绘线条自动转为蜡染风格' },
];

export default function ARShowcase() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeExample, setActiveExample] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const items = section.querySelectorAll('.animate-in');
    items.forEach((item, i) => {
      gsap.fromTo(item,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.6, delay: i * 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: item, start: 'top 90%' },
        }
      );
    });
    return () => { ScrollTrigger.getAll().forEach((st) => st.kill()); };
  }, []);

  return (
    <div style={{ backgroundColor: '#0B0E14', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="max-w-7xl mx-auto px-6 py-8" ref={sectionRef}>

        {/* Hero */}
        <div className="animate-in mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(232,74,58,0.1)', border: '1px solid rgba(232,74,58,0.2)' }}>
              <Sparkles size={14} style={{ color: '#E84A3A' }} />
              <span className="text-xs font-medium" style={{ color: '#E84A3A' }}>AI</span>
              <span className="text-xs text-[#F0EDE0] opacity-30">+</span>
              <Glasses size={14} style={{ color: '#2441A9' }} />
              <span className="text-xs font-medium" style={{ color: '#2441A9' }}>AR</span>
            </div>
          </div>
          <h1 className="font-bold text-[#F0EDE0] mb-4" style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)', lineHeight: 1.15 }}>
            {t("ars.fusion")}
          </h1>
          <p className="serif-text text-[#F0EDE0] opacity-50 max-w-2xl text-base leading-relaxed mb-8">
            从文字描述到纹样生成，再到增强现实预览——我们打通了"AI创作→AR体验→实体定制"的完整链路。
            让非物质文化遗产通过前沿科技，焕发全新的生命力。
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/ai-generator"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all hover:scale-[1.02]"
              style={{ backgroundColor: '#E84A3A', color: '#F0EDE0' }}
            >
              <Sparkles size={16} />
              开始 AI 创作
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/ar-experience"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all hover:scale-[1.02]"
              style={{ backgroundColor: 'rgba(36,65,169,0.2)', color: '#2441A9', border: '1px solid rgba(36,65,169,0.3)' }}
            >
              <Glasses size={16} />
              体验 {t("ars.try")}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Workflow */}
        <div className="animate-in mb-20">
          <h2 className="text-[#F0EDE0] font-bold text-xl mb-8 flex items-center gap-3">
            <Layers size={20} style={{ color: '#E84A3A' }} />
            {t("ars.workflow")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {WORKFLOW_STEPS.map((step, i) => (
              <div
                key={i}
                className="relative p-6 rounded-xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${step.color}15`,
                }}
              >
                <div
                  className="absolute -top-3 left-4 px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{ backgroundColor: step.color + '15', color: step.color }}
                >
                  STEP {step.num}
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 mt-2"
                  style={{ backgroundColor: step.color + '15' }}
                >
                  <step.icon size={20} style={{ color: step.color }} />
                </div>
                <h3 className="text-[#F0EDE0] font-bold text-sm mb-2">{step.title}</h3>
                <p className="serif-text text-[#F0EDE0] opacity-40 text-xs leading-relaxed mb-3">{step.desc}</p>
                <ul className="space-y-1">
                  {step.details.map((d, j) => (
                    <li key={j} className="flex items-center gap-1.5 text-[11px] text-[#F0EDE0] opacity-30">
                      <Star size={8} style={{ color: step.color }} />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="animate-in mb-20">
          <h2 className="text-[#F0EDE0] font-bold text-xl mb-8 flex items-center gap-3">
            <Zap size={20} style={{ color: '#2441A9' }} />
            {t("ars.tech")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="p-5 rounded-xl text-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.04)' }}
              >
                <f.icon size={24} className="mx-auto mb-3" style={{ color: '#2441A9' }} />
                <h4 className="text-[#F0EDE0] font-medium text-sm mb-1">{f.label}</h4>
                <p className="text-[10px] text-[#F0EDE0] opacity-30">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Examples */}
        <div className="animate-in mb-20">
          <h2 className="text-[#F0EDE0] font-bold text-xl mb-8 flex items-center gap-3">
            <Shirt size={20} style={{ color: '#C8913A' }} />
            {t("ars.examples")}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Example selector */}
            <div className="space-y-3">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setActiveExample(i)}
                  className="w-full p-4 rounded-xl text-left transition-all flex items-center gap-4"
                  style={{
                    backgroundColor: activeExample === i ? 'rgba(36,65,169,0.12)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${activeExample === i ? '#2441A960' : 'rgba(240,237,224,0.06)'}`,
                  }}
                >
                  <img src={ex.pattern} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[#F0EDE0] font-medium text-sm">{ex.title}</h4>
                    <p className="serif-text text-[#F0EDE0] opacity-30 text-[11px] line-clamp-1">{ex.prompt}</p>
                    <div className="flex gap-1 mt-1">
                      {ex.tags.map((t) => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(36,65,169,0.15)', color: '#2441A9' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Right: Preview */}
            <div
              className="rounded-xl overflow-hidden relative"
              style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(240,237,224,0.06)',
              }}
            >
              <div className="relative">
                <img
                  src={EXAMPLES[activeExample].preview}
                  alt={EXAMPLES[activeExample].title}
                  className="w-full aspect-[4/3] object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="w-32 h-32 rounded-lg overflow-hidden shadow-2xl"
                    style={{
                      border: '3px solid rgba(232,74,58,0.5)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  >
                    <img
                      src={EXAMPLES[activeExample].pattern}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] px-2 py-1 rounded-full font-medium" style={{ backgroundColor: 'rgba(36,65,169,0.7)', color: '#F0EDE0' }}>
                    AR 预览效果
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h4 className="text-[#F0EDE0] font-bold text-sm mb-1">{EXAMPLES[activeExample].title}</h4>
                <p className="serif-text text-[#F0EDE0] opacity-40 text-xs mb-3">{EXAMPLES[activeExample].prompt}</p>
                <div className="flex gap-2">
                  <Link
                    to="/ai-generator"
                    className="flex-1 py-2 rounded-lg text-xs text-center font-medium"
                    style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}
                  >
                    <Sparkles size={12} className="inline mr-1" />
                    {t("ars.same")}
                  </Link>
                  <Link
                    to="/ar-experience"
                    className="flex-1 py-2 rounded-lg text-xs text-center font-medium"
                    style={{ backgroundColor: 'rgba(232,74,58,0.15)', color: '#E84A3A' }}
                  >
                    <Glasses size={12} className="inline mr-1" />
                    {t("ars.try")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div
          className="animate-in rounded-2xl p-10 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(36,65,169,0.1), rgba(232,74,58,0.05))',
            border: '1px solid rgba(36,65,169,0.15)',
          }}
        >
          <h2 className="text-[#F0EDE0] font-bold text-2xl mb-3">
            {t("ars.cta_title")}
          </h2>
          <p className="serif-text text-[#F0EDE0] opacity-40 text-sm mb-6 max-w-lg mx-auto">
            {t("ars.cta_desc")}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/ai-generator"
              className="px-8 py-3 rounded-lg font-bold text-sm inline-flex items-center gap-2"
              style={{ backgroundColor: '#E84A3A', color: '#F0EDE0' }}
            >
              <Sparkles size={16} />
              {t("ars.create_now")}
            </Link>
            <Link
              to="/ar-experience"
              className="px-8 py-3 rounded-lg font-bold text-sm inline-flex items-center gap-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#F0EDE0', border: '1px solid rgba(240,237,224,0.1)' }}
            >
              <Glasses size={16} />
              {t("ars.ar_room")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
