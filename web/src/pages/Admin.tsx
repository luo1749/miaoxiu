import { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { api } from '../api';
import { toast } from 'sonner';
import {
  LayoutDashboard, TrendingUp, Users,
  Palette, Cpu, ShoppingBag,
  LogOut, Shield, MessageSquare,
  Trash2, Plus, X, Loader2,
} from 'lucide-react';

const ADMIN_TABS = [
  { key: 'overview', label: '数据概览', icon: LayoutDashboard },
  { key: 'patterns', label: '纹样管理', icon: Palette },
  { key: 'ai', label: 'AI模型', icon: Cpu },
  { key: 'users', label: '用户反馈', icon: Users },
  { key: 'shop', label: '商城管理', icon: ShoppingBag },
  { key: 'forum', label: '论坛审核', icon: MessageSquare },
];

const ROLE_LABEL: Record<string, string> = {
  guest: '游客',
  user: '创作者',
  admin: '管理员',
};

const STATUS_LABEL: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
};

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const { user, logout } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [aiStats, setAiStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const [showPatternModal, setShowPatternModal] = useState(false);
  const [patternForm, setPatternForm] = useState({ name: '', category: 'plant', description: '', meaning: '', occasion: '', image_url: '', tags: '' });

  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', price: '', stock: '', category: '', image_url: '', description: '' });

  const setLoad = (k: string, v: boolean) => setLoading((p) => ({ ...p, [k]: v }));

  const fetchStats = async () => {
    setLoad('stats', true);
    try {
      const [d, a] = await Promise.all([api.admin.dashboard(), api.admin.aiStats()]);
      setStats(d);
      setAiStats(a);
    } catch (e: any) {
      toast.error(e.message || '统计数据加载失败');
    } finally {
      setLoad('stats', false);
    }
  };

  const fetchUsers = async () => {
    setLoad('users', true);
    try {
      const data = await api.admin.users();
      setUsers(data || []);
    } catch (e: any) {
      toast.error(e.message || '用户加载失败');
    } finally {
      setLoad('users', false);
    }
  };

  const fetchPatterns = async () => {
    setLoad('patterns', true);
    try {
      const data = await api.patterns.list();
      setPatterns(data || []);
    } catch (e: any) {
      toast.error(e.message || '纹样加载失败');
    } finally {
      setLoad('patterns', false);
    }
  };

  const fetchProducts = async () => {
    setLoad('products', true);
    try {
      const data = await api.products.list();
      setProducts(data || []);
    } catch (e: any) {
      toast.error(e.message || '商品加载失败');
    } finally {
      setLoad('products', false);
    }
  };

  const fetchOrders = async () => {
    setLoad('orders', true);
    try {
      const data = await api.admin.orders();
      setOrders(data || []);
    } catch (e: any) {
      toast.error(e.message || '订单加载失败');
    } finally {
      setLoad('orders', false);
    }
  };

  const fetchPendingPosts = async () => {
    setLoad('forum', true);
    try {
      const data = await api.forum.posts({ status: 'pending' });
      setPendingPosts(data || []);
    } catch (e: any) {
      toast.error(e.message || '待审核帖子加载失败');
    } finally {
      setLoad('forum', false);
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await api.admin.logs();
      setLogs(data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLogs();
  }, []);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'patterns') fetchPatterns();
    if (tab === 'shop') { fetchProducts(); fetchOrders(); }
    if (tab === 'forum') fetchPendingPosts();
    if (tab === 'ai' && !aiStats) fetchStats();
  }, [tab]);

  const toggleUserRole = async (u: any) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await api.admin.updateUserRole(u.id, newRole);
      toast.success('角色已更新');
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || '更新失败');
    }
  };

  const toggleUserStatus = async (u: any) => {
    try {
      await api.admin.updateUserStatus(u.id, !u.is_active);
      toast.success('状态已更新');
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || '更新失败');
    }
  };

  const deletePattern = async (id: string) => {
    if (!confirm('确定删除该纹样？')) return;
    try {
      await api.patterns.delete(id);
      toast.success('已删除');
      fetchPatterns();
    } catch (e: any) {
      toast.error(e.message || '删除失败');
    }
  };

  const createPattern = async () => {
    try {
      await api.patterns.create({
        ...patternForm,
        tags: patternForm.tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
      });
      toast.success('纹样创建成功');
      setShowPatternModal(false);
      setPatternForm({ name: '', category: 'plant', description: '', meaning: '', occasion: '', image_url: '', tags: '' });
      fetchPatterns();
    } catch (e: any) {
      toast.error(e.message || '创建失败');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('确定删除该商品？')) return;
    try {
      await api.products.delete(id);
      toast.success('已删除');
      fetchProducts();
    } catch (e: any) {
      toast.error(e.message || '删除失败');
    }
  };

  const createProduct = async () => {
    try {
      await api.products.create({
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        original_price: undefined,
        image_url: productForm.image_url,
        category: productForm.category,
        stock: parseInt(productForm.stock, 10),
      });
      toast.success('商品创建成功');
      setShowProductModal(false);
      setProductForm({ name: '', price: '', stock: '', category: '', image_url: '', description: '' });
      fetchProducts();
    } catch (e: any) {
      toast.error(e.message || '创建失败');
    }
  };

  const updateOrderStatus = async (o: any, status: string) => {
    try {
      await api.admin.updateOrderStatus(o.id, status);
      toast.success('订单状态已更新');
      fetchOrders();
    } catch (e: any) {
      toast.error(e.message || '更新失败');
    }
  };

  const auditPost = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.forum.audit(id, status);
      toast.success(status === 'approved' ? '已通过' : '已拒绝');
      fetchPendingPosts();
    } catch (e: any) {
      toast.error(e.message || '审核失败');
    }
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    return Math.floor(diff / 86400000) + '天前';
  };

  const statCards = stats ? [
    { label: '注册用户', value: stats.total_users, icon: Users },
    { label: '纹样数量', value: stats.total_patterns, icon: Palette },
    { label: 'AI生成次数', value: stats.total_generated, icon: Cpu },
    { label: '论坛帖子', value: stats.total_posts, icon: MessageSquare },
    { label: '订单数量', value: stats.total_orders, icon: ShoppingBag },
    { label: '研学课程', value: stats.total_courses, icon: Cpu },
    { label: '文创商品', value: stats.total_products, icon: ShoppingBag },
    { label: '今日生成', value: stats.today_generated, icon: TrendingUp },
    { label: '待审核帖子', value: stats.pending_posts, icon: MessageSquare },
  ] : [];

  return (
    <div style={{ backgroundColor: '#0B0E14', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <LayoutDashboard size={24} style={{ color: '#E84A3A' }} />
              <span className="text-sm font-medium tracking-widest uppercase" style={{ color: '#E84A3A' }}>
                ADMIN DASHBOARD
              </span>
            </div>
            <h1 className="font-bold text-[#F0EDE0] flex items-center gap-3" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              后台管理中心
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
            退出管理
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
                border: '1px solid',
                borderColor: tab === t.key ? 'rgba(36,65,169,0.5)' : 'rgba(240,237,224,0.06)',
              }}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {loading.stats ? (
              <div className="text-center py-12"><Loader2 className="animate-spin mx-auto" style={{ color: '#2441A9' }} /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {statCards.map((s) => (
                  <div key={s.label} className="p-5 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
                    <s.icon size={18} className="mb-3" style={{ color: '#2441A9' }} />
                    <div className="text-2xl font-bold text-[#F0EDE0]">{s.value}</div>
                    <div className="text-xs text-[#F0EDE0] opacity-40 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
                <h3 className="text-[#F0EDE0] font-bold text-sm mb-4">热门提示词 TOP 5</h3>
                <div className="space-y-3">
                  {['苗绣风格的蝴蝶妈妈，几何对称，红蓝配色', '蜡染水波纹，蓝白配色，手绘质感', '铜鼓纹几何图案，同心圆结构', '苗族龙纹图腾，几何线条风格', '花卉纹与藤蔓交织，打籽绣质感'].map((t, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: 'rgba(36,65,169,0.2)', color: '#2441A9' }}>{i + 1}</span>
                      <span className="text-[#F0EDE0] opacity-60 flex-1">{t}</span>
                      <span className="text-[#F0EDE0] opacity-30">{342 - i * 50}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
                <h3 className="text-[#F0EDE0] font-bold text-sm mb-4">最近操作日志</h3>
                <div className="space-y-2 max-h-60 overflow-auto">
                  {logs.length === 0 ? (
                    <p className="text-xs text-[#F0EDE0] opacity-40">暂无日志</p>
                  ) : (
                    logs.slice(0, 10).map((l: any) => (
                      <div key={l.id} className="flex items-center gap-2 text-xs">
                        <span className="text-[#F0EDE0] opacity-60">{l.action}</span>
                        <span className="text-[#F0EDE0] opacity-30 flex-1">{l.target}</span>
                        <span className="text-[#F0EDE0] opacity-20">{timeAgo(l.created_at)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Patterns */}
        {tab === 'patterns' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[#F0EDE0] font-bold text-sm">纹样数据集</h3>
              <button onClick={() => setShowPatternModal(true)} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium" style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}>
                <Plus size={14} /> 新增纹样
              </button>
            </div>
            {loading.patterns ? (
              <div className="text-center py-12"><Loader2 className="animate-spin mx-auto" style={{ color: '#2441A9' }} /></div>
            ) : (
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
                <table className="w-full text-left text-xs">
                  <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <tr>
                      <th className="p-3 text-[#F0EDE0] opacity-50">名称</th>
                      <th className="p-3 text-[#F0EDE0] opacity-50">分类</th>
                      <th className="p-3 text-[#F0EDE0] opacity-50">寓意</th>
                      <th className="p-3 text-[#F0EDE0] opacity-50">浏览</th>
                      <th className="p-3 text-[#F0EDE0] opacity-50">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patterns.map((p) => (
                      <tr key={p.id} style={{ borderTop: '1px solid rgba(240,237,224,0.04)' }}>
                        <td className="p-3 text-[#F0EDE0]">{p.name}</td>
                        <td className="p-3 text-[#F0EDE0] opacity-60">{p.category}</td>
                        <td className="p-3 text-[#F0EDE0] opacity-60 truncate max-w-xs">{p.meaning}</td>
                        <td className="p-3 text-[#F0EDE0] opacity-60">{p.views}</td>
                        <td className="p-3">
                          <button onClick={() => deletePattern(p.id)} className="p-1 rounded hover:bg-red-500/20" title="删除">
                            <Trash2 size={14} style={{ color: '#E84A3A' }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* AI */}
        {tab === 'ai' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'AI生成总次数', value: aiStats?.total ?? 0 },
                { label: '今日生成', value: aiStats?.today ?? 0 },
              ].map((s) => (
                <div key={s.label} className="p-5 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
                  <div className="text-2xl font-bold text-[#F0EDE0]">{s.value}</div>
                  <div className="text-xs text-[#F0EDE0] opacity-40 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
              <h3 className="text-[#F0EDE0] font-bold text-sm mb-4">按风格统计</h3>
              <div className="space-y-2">
                {(aiStats?.by_style || []).map((item: any) => (
                  <div key={item.style} className="flex items-center justify-between text-xs">
                    <span className="text-[#F0EDE0] opacity-60">{item.style}</span>
                    <span className="text-[#F0EDE0] font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="space-y-4">
            <h3 className="text-[#F0EDE0] font-bold text-sm">用户列表</h3>
            {loading.users ? (
              <div className="text-center py-12"><Loader2 className="animate-spin mx-auto" style={{ color: '#2441A9' }} /></div>
            ) : (
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
                <table className="w-full text-left text-xs">
                  <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <tr>
                      <th className="p-3 text-[#F0EDE0] opacity-50">昵称</th>
                      <th className="p-3 text-[#F0EDE0] opacity-50">邮箱</th>
                      <th className="p-3 text-[#F0EDE0] opacity-50">角色</th>
                      <th className="p-3 text-[#F0EDE0] opacity-50">状态</th>
                      <th className="p-3 text-[#F0EDE0] opacity-50">注册时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderTop: '1px solid rgba(240,237,224,0.04)' }}>
                        <td className="p-3 text-[#F0EDE0]">{u.name}</td>
                        <td className="p-3 text-[#F0EDE0] opacity-60">{u.email}</td>
                        <td className="p-3">
                          <button onClick={() => toggleUserRole(u)} className="px-2 py-1 rounded text-[10px] font-medium" style={{ backgroundColor: u.role === 'admin' ? 'rgba(232,74,58,0.15)' : 'rgba(36,65,169,0.15)', color: u.role === 'admin' ? '#E84A3A' : '#2441A9' }}>
                            {ROLE_LABEL[u.role] || u.role}
                          </button>
                        </td>
                        <td className="p-3">
                          <button onClick={() => toggleUserStatus(u)} className="px-2 py-1 rounded text-[10px] font-medium" style={{ backgroundColor: u.is_active ? 'rgba(36,65,169,0.15)' : 'rgba(255,255,255,0.05)', color: u.is_active ? '#2441A9' : 'rgba(240,237,224,0.5)' }}>
                            {u.is_active ? '正常' : '禁用'}
                          </button>
                        </td>
                        <td className="p-3 text-[#F0EDE0] opacity-40">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Shop */}
        {tab === 'shop' && (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[#F0EDE0] font-bold text-sm">商品管理</h3>
                <button onClick={() => setShowProductModal(true)} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium" style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}>
                  <Plus size={14} /> 新增商品
                </button>
              </div>
              {loading.products ? (
                <div className="text-center py-12"><Loader2 className="animate-spin mx-auto" style={{ color: '#2441A9' }} /></div>
              ) : (
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
                  <table className="w-full text-left text-xs">
                    <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <tr>
                        <th className="p-3 text-[#F0EDE0] opacity-50">商品</th>
                        <th className="p-3 text-[#F0EDE0] opacity-50">分类</th>
                        <th className="p-3 text-[#F0EDE0] opacity-50">价格</th>
                        <th className="p-3 text-[#F0EDE0] opacity-50">库存</th>
                        <th className="p-3 text-[#F0EDE0] opacity-50">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} style={{ borderTop: '1px solid rgba(240,237,224,0.04)' }}>
                          <td className="p-3 text-[#F0EDE0]">{p.name}</td>
                          <td className="p-3 text-[#F0EDE0] opacity-60">{p.category}</td>
                          <td className="p-3 text-[#F0EDE0] opacity-60">¥{p.price.toFixed(2)}</td>
                          <td className="p-3 text-[#F0EDE0] opacity-60">{p.stock}</td>
                          <td className="p-3">
                            <button onClick={() => deleteProduct(p.id)} className="p-1 rounded hover:bg-red-500/20" title="删除">
                              <Trash2 size={14} style={{ color: '#E84A3A' }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-[#F0EDE0] font-bold text-sm">订单管理</h3>
              {loading.orders ? (
                <div className="text-center py-12"><Loader2 className="animate-spin mx-auto" style={{ color: '#2441A9' }} /></div>
              ) : (
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
                  <table className="w-full text-left text-xs">
                    <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <tr>
                        <th className="p-3 text-[#F0EDE0] opacity-50">订单号</th>
                        <th className="p-3 text-[#F0EDE0] opacity-50">用户</th>
                        <th className="p-3 text-[#F0EDE0] opacity-50">金额</th>
                        <th className="p-3 text-[#F0EDE0] opacity-50">状态</th>
                        <th className="p-3 text-[#F0EDE0] opacity-50">时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id} style={{ borderTop: '1px solid rgba(240,237,224,0.04)' }}>
                          <td className="p-3 text-[#F0EDE0] opacity-60">{o.id.slice(0, 8)}</td>
                          <td className="p-3 text-[#F0EDE0] opacity-60">{o.user?.name || '未知'}</td>
                          <td className="p-3 text-[#F0EDE0]">¥{o.total_amount.toFixed(2)}</td>
                          <td className="p-3">
                            <select
                              value={o.status}
                              onChange={(e) => updateOrderStatus(o, e.target.value)}
                              className="bg-transparent text-[10px] px-2 py-1 rounded border"
                              style={{ borderColor: 'rgba(240,237,224,0.1)', color: '#F0EDE0' }}
                            >
                              {Object.keys(STATUS_LABEL).map((k) => (
                                <option key={k} value={k} style={{ backgroundColor: '#0B0E14' }}>{STATUS_LABEL[k]}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 text-[#F0EDE0] opacity-40">{new Date(o.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Forum Audit */}
        {tab === 'forum' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#F0EDE0] font-bold text-sm">待审核帖子</h3>
              <span className="text-xs text-[#F0EDE0] opacity-40">共 {pendingPosts.length} 条</span>
            </div>
            {loading.forum ? (
              <div className="text-center py-12"><Loader2 className="animate-spin mx-auto" style={{ color: '#2441A9' }} /></div>
            ) : pendingPosts.length === 0 ? (
              <div className="text-center py-12 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
                <MessageSquare size={32} className="mx-auto mb-3" style={{ color: 'rgba(240,237,224,0.1)' }} />
                <p className="text-[#F0EDE0] opacity-40 text-sm">暂无待审核帖子</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPosts.map((post) => (
                  <div key={post.id} className="rounded-xl p-5" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-[#F0EDE0]">{post.author?.name || '匿名用户'}</span>
                      <span className="text-[10px] text-[#F0EDE0] opacity-30">{timeAgo(post.created_at)}</span>
                    </div>
                    <h4 className="text-[#F0EDE0] font-bold text-sm mb-1">{post.title}</h4>
                    <p className="text-[#F0EDE0] opacity-50 text-sm leading-relaxed mb-3">{post.content}</p>
                    {post.images?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.images.map((img: string, i: number) => (
                          <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button onClick={() => auditPost(post.id, 'approved')} className="px-4 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}>通过</button>
                      <button onClick={() => auditPost(post.id, 'rejected')} className="px-4 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: 'rgba(232,74,58,0.15)', color: '#E84A3A' }}>拒绝</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pattern Modal */}
        {showPatternModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(11,14,20,0.85)' }} onClick={() => setShowPatternModal(false)}>
            <div className="relative w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#0B0E14', border: '1px solid rgba(240,237,224,0.1)' }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowPatternModal(false)} className="absolute top-4 right-4"><X size={16} className="text-[#F0EDE0] opacity-40" /></button>
              <h3 className="text-[#F0EDE0] font-bold text-lg mb-4">新增纹样</h3>
              <div className="space-y-3">
                {[
                  { k: 'name', p: '名称' },
                  { k: 'description', p: '描述' },
                  { k: 'meaning', p: '寓意' },
                  { k: 'occasion', p: '使用场合' },
                  { k: 'image_url', p: '图片 URL' },
                  { k: 'tags', p: '标签，逗号分隔' },
                ].map((f) => (
                  <input
                    key={f.k}
                    value={(patternForm as any)[f.k]}
                    onChange={(e) => setPatternForm((p) => ({ ...p, [f.k]: e.target.value }))}
                    placeholder={f.p}
                    className="w-full px-4 py-2 rounded-lg text-sm text-[#F0EDE0]"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,237,224,0.1)' }}
                  />
                ))}
                <select
                  value={patternForm.category}
                  onChange={(e) => setPatternForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg text-sm text-[#F0EDE0]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,237,224,0.1)' }}
                >
                  <option value="plant" style={{ backgroundColor: '#0B0E14' }}>植物纹</option>
                  <option value="animal" style={{ backgroundColor: '#0B0E14' }}>动物纹</option>
                  <option value="geometry" style={{ backgroundColor: '#0B0E14' }}>几何纹</option>
                  <option value="mythology" style={{ backgroundColor: '#0B0E14' }}>神话人物纹</option>
                </select>
                <button onClick={createPattern} className="w-full py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}>创建</button>
              </div>
            </div>
          </div>
        )}

        {/* Product Modal */}
        {showProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(11,14,20,0.85)' }} onClick={() => setShowProductModal(false)}>
            <div className="relative w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#0B0E14', border: '1px solid rgba(240,237,224,0.1)' }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowProductModal(false)} className="absolute top-4 right-4"><X size={16} className="text-[#F0EDE0] opacity-40" /></button>
              <h3 className="text-[#F0EDE0] font-bold text-lg mb-4">新增商品</h3>
              <div className="space-y-3">
                {[
                  { k: 'name', p: '商品名称' },
                  { k: 'price', p: '价格' },
                  { k: 'stock', p: '库存' },
                  { k: 'category', p: '分类' },
                  { k: 'image_url', p: '图片 URL' },
                  { k: 'description', p: '描述' },
                ].map((f) => (
                  <input
                    key={f.k}
                    value={(productForm as any)[f.k]}
                    onChange={(e) => setProductForm((p) => ({ ...p, [f.k]: e.target.value }))}
                    placeholder={f.p}
                    className="w-full px-4 py-2 rounded-lg text-sm text-[#F0EDE0]"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,237,224,0.1)' }}
                  />
                ))}
                <button onClick={createProduct} className="w-full py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}>创建</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
