import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n';
import { api } from '../api';
import { Package, CreditCard, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  items: { name: string; price: number; quantity: number }[];
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待支付', color: '#E8A33A' },
  paid: { label: '已支付', color: '#34D399' },
  shipped: { label: '已发货', color: '#60A5FA' },
  completed: { label: '已完成', color: '#A78BFA' },
  cancelled: { label: '已取消', color: '#9CA3AF' },
};

export default function Orders() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.orders.list()
      .then(setOrders)
      .catch((e) => toast.error(e.message || '订单加载失败'))
      .finally(() => setLoading(false));
  }, []);

  const handlePay = async (id: string) => {
    try {
      await api.orders.pay(id);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'paid' } : o)));
      toast.success('支付成功');
    } catch (e: any) {
      toast.error(e.message || '支付失败');
    }
  };

  return (
    <div style={{ backgroundColor: '#0B0E14', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link to="/shop" className="inline-flex items-center gap-1 text-xs mb-6 opacity-50 hover:opacity-80" style={{ color: '#F0EDE0' }}>
          <ArrowLeft size={14} /> 返回商城
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <Package size={28} style={{ color: '#E84A3A' }} />
          <h1 className="font-bold text-[#F0EDE0]" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
            {t('orders.title') || '我的订单'}
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#F0EDE0] opacity-50">加载中...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ border: '1px solid rgba(240,237,224,0.08)' }}>
            <Package size={48} className="mx-auto mb-4 opacity-20" style={{ color: '#F0EDE0' }} />
            <p className="text-[#F0EDE0] opacity-50">暂无订单</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="rounded-2xl p-6"
                style={{ backgroundColor: 'rgba(240,237,224,0.03)', border: '1px solid rgba(240,237,224,0.08)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs opacity-40" style={{ color: '#F0EDE0' }}>订单号 {o.id.slice(0, 8)}</p>
                    <p className="text-xs opacity-40 mt-1" style={{ color: '#F0EDE0' }}>{new Date(o.created_at).toLocaleString()}</p>
                  </div>
                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{ backgroundColor: `${STATUS_MAP[o.status]?.color || '#999'}20`, color: STATUS_MAP[o.status]?.color || '#999' }}
                  >
                    {STATUS_MAP[o.status]?.label || o.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {o.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm" style={{ color: '#F0EDE0' }}>
                      <span className="opacity-80">{item.name} × {item.quantity}</span>
                      <span className="opacity-60">¥{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(240,237,224,0.06)' }}>
                  <span className="text-lg font-bold text-[#F0EDE0]">
                    合计 <span style={{ color: '#E84A3A' }}>¥{o.total_amount.toFixed(2)}</span>
                  </span>
                  {o.status === 'pending' && (
                    <button
                      onClick={() => handlePay(o.id)}
                      className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
                      style={{ backgroundColor: '#34D399', color: '#0B0E14' }}
                    >
                      <CreditCard size={14} /> 模拟支付
                    </button>
                  )}
                  {o.status === 'paid' && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#34D399' }}>
                      <CheckCircle size={14} /> 已支付
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
