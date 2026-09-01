import { useI18n } from "../i18n";
import { useState } from 'react';
import { useAuth } from '../auth';
import {
  LayoutDashboard, TrendingUp, Users, Eye,
  ThumbsUp, ArrowUpRight,
  Palette, Cpu, ShoppingBag,
  LogOut, Shield,
} from 'lucide-react';

const ADMIN_TABS = [
  { key: 'overview', label: '数据概览', icon: LayoutDashboard },
  { key: 'patterns', label: '纹样管理', icon: Palette },
  { key: 'ai', label: 'AI模型', icon: Cpu },
  { key: 'users', label: '用户反馈', icon: Users },
  { key: 'shop', label: '商城管理', icon: ShoppingBag },
];

const CHART_DATA = [
  { label: '1月', ai: 120, ar: 80, kg: 200 },
  { label: '2月', ai: 180, ar: 120, kg: 250 },
  { label: '3月', ai: 250, ar: 180, kg: 320 },
  { label: '4月', ai: 380, ar: 250, kg: 400 },
  { label: '5月', ai: 520, ar: 350, kg: 480 },
  { label: '6月', ai: 680, ar: 420, kg: 560 },
];

const TOP_PROMPTS = [
  { text: '苗绣风格的蝴蝶妈妈，几何对称，红蓝配色', count: 342 },
  { text: '蜡染水波纹，蓝白配色，手绘质感', count: 256 },
  { text: '铜鼓纹几何图案，同心圆结构', count: 198 },
  { text: '苗族龙纹图腾，几何线条风格', count: 165 },
  { text: '花卉纹与藤蔓交织，打籽绣质感', count: 143 },
];

const FEEDBACK_DATA = [
  { id: 1, user: '纹样研究员', content: 'AI生成的纹样质量很高，希望能增加更多风格选项', rating: 'up', date: '2024-05-30' },
  { id: 2, user: '设计新锐', content: 'AR试穿效果很好，但加载速度有待优化', rating: 'up', date: '2024-05-29' },
  { id: 3, user: '蜡染传承人', content: '纹样库中的传统纹样分类可以更细致', rating: 'down', date: '2024-05-28' },
  { id: 4, user: '游客小王', content: '文化故事部分很有趣，学到了很多知识', rating: 'up', date: '2024-05-27' },
  { id: 5, user: '大学生团队', content: '希望能导出数据用于学术研究', rating: 'up', date: '2024-05-26' },
];

const PATTERN_ROWS = [
  { id: 'KG-001', name: '蝴蝶妈妈', cat: '神话人物纹', region: '松桃苗绣', year: '清代', craft: '平绣', status: '已发布' },
  { id: 'KG-002', name: '龙纹图腾', cat: '动物纹', region: '松桃苗绣', year: '民国', craft: '辫绣', status: '已发布' },
  { id: 'KG-003', name: '铜鼓纹', cat: '几何纹', region: '松桃/台江', year: '明代', craft: '织锦', status: '已发布' },
  { id: 'KG-004', name: '水波纹', cat: '几何纹', region: '江口蜡染', year: '清代', craft: '蜡染', status: '审核中' },
  { id: 'KG-005', name: '牡丹花卉纹', cat: '植物纹', region: '松桃苗绣', year: '民国', craft: '打籽绣', status: '已发布' },
  { id: 'KG-006', name: '螺旋纹', cat: '几何纹', region: '施秉蜡染', year: '清代', craft: '蜡染', status: '已发布' },
];

export default function Admin() {
  const { t } = useI18n();
  const [tab, setTab] = useState('overview');
  const { user, logout } = useAuth();

  return (
    <div style={{ backgroundColor: '#0B0E14', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <LayoutDashboard size={24} style={{ color: '#E84A3A' }} />
              <span className="text-sm font-medium tracking-widest uppercase" style={{ color: '#E84A3A' }}>
                {t("adm.label")}
              </span>
            </div>
            <h1 className="font-bold text-[#F0EDE0] flex items-center gap-3" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              {t("adm.title")}
              <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(232,74,58,0.15)', color: '#E84A3A' }}>
                <Shield size={10} className="inline mr-1" />
                {user?.name}
              </span>
            </h1>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(240,237,224,0.5)', border: '1px solid rgba(240,237,224,0.1)' }}
          >
            <LogOut size={12} />
            {t("adm.logout")}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {ADMIN_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all shrink-0"
              style={{
                backgroundColor: tab === t.key ? 'rgba(36,65,169,0.2)' : 'rgba(255,255,255,0.02)',
                color: tab === t.key ? '#F0EDE0' : 'rgba(240,237,224,0.5)',
                border: `1px solid ${tab === t.key ? '#2441A9' : 'rgba(240,237,224,0.06)'}`,
              }}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'AI生成总次数', value: '2,130', change: '+23%', icon: Cpu, color: '#2441A9' },
                { label: 'AR体验次数', value: '1,400', change: '+18%', icon: Eye, color: '#E84A3A' },
                { label: '活跃用户', value: '856', change: '+12%', icon: Users, color: '#1B4D3E' },
                { label: '商城订单', value: '168', change: '+35%', icon: ShoppingBag, color: '#C8913A' },
              ].map((stat) => (
                <div key={stat.label} className="p-5 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <stat.icon size={18} style={{ color: stat.color }} />
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#4CAF50' }}>
                      <ArrowUpRight size={12} />
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-[#F0EDE0] font-bold text-2xl mb-1">{stat.value}</div>
                  <div className="text-xs text-[#F0EDE0] opacity-40">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
                <h3 className="text-[#F0EDE0] font-bold text-sm mb-6">{t("adm.trend")}</h3>
                <div className="flex items-end gap-4 h-48">
                  {CHART_DATA.map((d, i) => {
                    const maxVal = Math.max(...CHART_DATA.map((c) => Math.max(c.ai, c.ar, c.kg)));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex gap-0.5 items-end" style={{ height: '160px' }}>
                          <div className="flex-1 rounded-t" style={{ height: `${(d.ai / maxVal) * 100}%`, backgroundColor: '#2441A9', opacity: 0.8 }} />
                          <div className="flex-1 rounded-t" style={{ height: `${(d.ar / maxVal) * 100}%`, backgroundColor: '#E84A3A', opacity: 0.8 }} />
                          <div className="flex-1 rounded-t" style={{ height: `${(d.kg / maxVal) * 100}%`, backgroundColor: '#1B4D3E', opacity: 0.8 }} />
                        </div>
                        <span className="text-[10px] text-[#F0EDE0] opacity-40">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-4 justify-center">
                  <span className="flex items-center gap-1 text-[10px] text-[#F0EDE0] opacity-50"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#2441A9' }} />AI生成</span>
                  <span className="flex items-center gap-1 text-[10px] text-[#F0EDE0] opacity-50"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#E84A3A' }} />AR体验</span>
                  <span className="flex items-center gap-1 text-[10px] text-[#F0EDE0] opacity-50"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#1B4D3E' }} />知识图谱</span>
                </div>
              </div>

              <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
                <h3 className="text-[#F0EDE0] font-bold text-sm mb-4">{t("adm.top_prompts")}</h3>
                <div className="space-y-3">
                  {TOP_PROMPTS.map((p, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs font-bold shrink-0" style={{ color: i < 3 ? '#E84A3A' : 'rgba(240,237,224,0.3)' }}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#F0EDE0] opacity-60 line-clamp-2">{p.text}</p>
                        <span className="text-[10px] text-[#F0EDE0] opacity-30">{p.count} 次使用</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
              <h3 className="text-[#F0EDE0] font-bold text-sm mb-4">最新{t("adm.tab_users")}</h3>
              <div className="space-y-3">
                {FEEDBACK_DATA.map((f) => (
                  <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${f.rating === 'up' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      <ThumbsUp size={12} className={f.rating === 'up' ? 'text-green-400' : 'text-red-400'} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-[#F0EDE0] font-medium">{f.user}</span>
                        <span className="text-[10px] text-[#F0EDE0] opacity-30">{f.date}</span>
                      </div>
                      <p className="text-xs text-[#F0EDE0] opacity-50">{f.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full py-2 rounded-lg text-xs text-center" style={{ backgroundColor: 'rgba(36,65,169,0.15)', color: '#2441A9' }}>
                {t("adm.export_csv")}
              </button>
            </div>
          </div>
        )}

        {/* Patterns */}
        {tab === 'patterns' && (
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#F0EDE0] font-bold text-sm">{t("adm.patterns_title")}（{PATTERN_ROWS.length} 条）</h3>
              <button className="px-4 py-2 rounded-lg text-xs" style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}>+ {t("adm.upload")}</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    {['ID', '名称', '分类', '地区', '年代', '工艺', '状态', '操作'].map((h) => (
                      <th key={h} className="pb-3 pr-4 text-xs text-[#F0EDE0] opacity-40 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PATTERN_ROWS.map((row) => (
                    <tr key={row.id} className="border-b border-white/3">
                      <td className="py-3 pr-4 text-xs text-[#F0EDE0] opacity-50">{row.id}</td>
                      <td className="py-3 pr-4 text-xs text-[#F0EDE0] font-medium">{row.name}</td>
                      <td className="py-3 pr-4 text-xs text-[#F0EDE0] opacity-50">{row.cat}</td>
                      <td className="py-3 pr-4 text-xs text-[#F0EDE0] opacity-50">{row.region}</td>
                      <td className="py-3 pr-4 text-xs text-[#F0EDE0] opacity-50">{row.year}</td>
                      <td className="py-3 pr-4 text-xs text-[#F0EDE0] opacity-50">{row.craft}</td>
                      <td className="py-3 pr-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: row.status === '已发布' ? 'rgba(27,77,62,0.3)' : 'rgba(201,145,58,0.3)', color: row.status === '已发布' ? '#4CAF50' : '#C8913A' }}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button className="text-[10px] text-[#2441A9] hover:underline">编辑</button>
                          <button className="text-[10px] text-[#E84A3A] hover:underline">删除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Models */}
        {tab === 'ai' && (
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
            <h3 className="text-[#F0EDE0] font-bold text-sm mb-6">{t("adm.ai_models")}</h3>
            <div className="space-y-4">
              {[
                { version: 'v3.2', name: '铜仁苗绣 LoRA 主模型', status: '当前使用', date: '2024-05-15', params: '1.5B' },
                { version: 'v3.1', name: '铜仁苗绣 LoRA 主模型', status: '可用', date: '2024-04-20', params: '1.2B' },
                { version: 'v3.0', name: '铜仁苗绣 LoRA 主模型', status: '可用', date: '2024-03-10', params: '1.0B' },
                { version: 'v2.5', name: '蜡染风格专项模型', status: '可用', date: '2024-02-01', params: '800M' },
              ].map((model) => (
                <div key={model.version} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(240,237,224,0.04)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(36,65,169,0.15)' }}>
                      <Cpu size={18} style={{ color: '#2441A9' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#F0EDE0] font-medium">{model.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(36,65,169,0.2)', color: '#2441A9' }}>{model.version}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-[#F0EDE0] opacity-30">{model.params} 参数</span>
                        <span className="text-[10px] text-[#F0EDE0] opacity-30">{model.date}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: model.status === '当前使用' ? 'rgba(27,77,62,0.3)' : 'rgba(255,255,255,0.05)', color: model.status === '当前使用' ? '#4CAF50' : 'rgba(240,237,224,0.5)' }}>
                          {model.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs"
                    style={{ backgroundColor: model.status === '当前使用' ? 'rgba(255,255,255,0.05)' : 'rgba(36,65,169,0.2)', color: model.status === '当前使用' ? 'rgba(240,237,224,0.4)' : '#2441A9' }}
                    disabled={model.status === '当前使用'}
                  >
                    {model.status === '当前使用' ? '使用中' : '切换'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
              <h3 className="text-[#F0EDE0] font-bold text-sm mb-4">{t("adm.user_stats")}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '总注册用户', value: '1,247', icon: Users },
                  { label: '本月活跃', value: '856', icon: TrendingUp },
                  { label: 'AI生成总次数', value: '2,130', icon: Cpu },
                  { label: 'AR体验总次数', value: '1,400', icon: Eye },
                ].map((s) => (
                  <div key={s.label} className="p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    <s.icon size={18} className="mx-auto mb-2" style={{ color: '#2441A9' }} />
                    <div className="text-[#F0EDE0] font-bold text-lg">{s.value}</div>
                    <div className="text-[10px] text-[#F0EDE0] opacity-40">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
              <h3 className="text-[#F0EDE0] font-bold text-sm mb-4">{t("adm.tab_users")}与评价</h3>
              <div className="space-y-2">
                {FEEDBACK_DATA.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    <ThumbsUp size={14} className={f.rating === 'up' ? 'text-green-400' : 'text-red-400'} />
                    <span className="text-xs text-[#F0EDE0] opacity-60 flex-1">{f.content}</span>
                    <span className="text-[10px] text-[#F0EDE0] opacity-30">{f.user}</span>
                    <span className="text-[10px] text-[#F0EDE0] opacity-20">{f.date}</span>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full py-2 rounded-lg text-xs text-center" style={{ backgroundColor: 'rgba(36,65,169,0.15)', color: '#2441A9' }}>
                {t("adm.export_user")}
              </button>
            </div>
          </div>
        )}

        {/* Shop */}
        {tab === 'shop' && (
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
            <h3 className="text-[#F0EDE0] font-bold text-sm mb-6">{t("adm.shop_title")}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: '总订单', value: '168' },
                { label: '总销售额', value: '¥42,680' },
                { label: '在售商品', value: '24' },
                { label: '转化率', value: '3.2%' },
              ].map((s) => (
                <div key={s.label} className="p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <div className="text-[#F0EDE0] font-bold text-xl">{s.value}</div>
                  <div className="text-[10px] text-[#F0EDE0] opacity-40 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <h4 className="text-xs text-[#F0EDE0] opacity-50 mb-3">最近订单</h4>
            <div className="space-y-2">
              {[
                { product: '苗绣丝巾·蝴蝶妈妈', user: '文创爱好者', price: '¥268', date: '2024-06-01' },
                { product: '蜡染T恤·铜鼓纹', user: '设计师小王', price: '¥168', date: '2024-06-01' },
                { product: '手工蜡染装饰画', user: '非遗研究院', price: '¥588', date: '2024-05-31' },
                { product: '数码印花帆布包', user: '大学生团队', price: '¥128', date: '2024-05-30' },
              ].map((o, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <span className="text-xs text-[#F0EDE0]">{o.product}</span>
                    <span className="text-[10px] text-[#F0EDE0] opacity-30 ml-2">{o.user}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#E84A3A] font-medium">{o.price}</span>
                    <span className="text-[10px] text-[#F0EDE0] opacity-20">{o.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
