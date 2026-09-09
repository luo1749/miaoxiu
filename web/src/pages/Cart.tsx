import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useI18n } from '../i18n';
import { api } from '../api';
import { useAuth } from '../auth';
import { useAppStore, type CartItem } from '../store';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

function mapServerCartItem(item: any): CartItem {
  return {
    id: item.id,
    productId: item.product?.id ?? item.id,
    name: item.product?.name ?? '商品',
    price: item.product?.price ?? 0,
    image: item.product?.image_url ?? '',
    quantity: item.quantity,
    type: 'handmade',
  };
}

export default function Cart() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { cart, removeFromCart, updateQuantity, setCart, clearCart } = useAppStore();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.cart
      .list()
      .then((items) => setCart(items.map(mapServerCartItem)))
      .catch(() => toast.error('购物车加载失败'))
      .finally(() => setLoading(false));
  }, [isLoggedIn, setCart]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const updateQty = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      if (isLoggedIn) {
        try { await api.cart.remove(item.id); } catch {}
      }
      removeFromCart(item.id);
    } else {
      if (isLoggedIn) {
        try {
          await api.cart.update(item.id, newQty);
        } catch (e: any) {
          toast.error(e.message || '更新数量失败');
          return;
        }
      }
      updateQuantity(item.id, newQty);
    }
  };

  const handleRemove = async (id: string) => {
    if (isLoggedIn) {
      try { await api.cart.remove(id); } catch {}
    }
    removeFromCart(id);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!isLoggedIn) {
      toast.error('请先登录后下单');
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      const items = cart.map((i) => ({ product_id: i.productId, quantity: i.quantity }));
      await api.orders.create(items);
      clearCart();
      toast.success('订单创建成功，即将跳转');
      navigate('/orders');
    } catch (e: any) {
      toast.error(e.message || '下单失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0B0E14', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link to="/shop" className="inline-flex items-center gap-1 text-xs mb-6 opacity-50 hover:opacity-80" style={{ color: '#F0EDE0' }}>
          <ArrowLeft size={14} /> 继续购物
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <ShoppingCart size={28} style={{ color: '#E84A3A' }} />
          <h1 className="font-bold text-[#F0EDE0]" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
            {t('cart.title') || '购物车'}
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#F0EDE0] opacity-50">加载中...</div>
        ) : cart.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ border: '1px solid rgba(240,237,224,0.08)' }}>
            <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" style={{ color: '#F0EDE0' }} />
            <p className="text-[#F0EDE0] opacity-50 mb-6">购物车还是空的</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold"
              style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}
            >
              去逛逛
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 rounded-xl"
                  style={{ backgroundColor: 'rgba(240,237,224,0.03)', border: '1px solid rgba(240,237,224,0.08)' }}
                >
                  <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#F0EDE0] font-bold text-sm truncate">{item.name}</h3>
                    <p className="text-xs opacity-50 mt-1" style={{ color: '#F0EDE0' }}>单价 ¥{item.price}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <button onClick={() => updateQty(item, -1)} className="p-1 rounded hover:bg-white/5" style={{ color: '#F0EDE0' }}>
                        <Minus size={14} />
                      </button>
                      <span className="text-sm text-[#F0EDE0] w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item, 1)} className="p-1 rounded hover:bg-white/5" style={{ color: '#F0EDE0' }}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <span className="font-bold text-[#F0EDE0]">¥{(item.price * item.quantity).toFixed(2)}</span>
                    <button onClick={() => handleRemove(item.id)} className="p-1.5 rounded hover:bg-white/5" style={{ color: '#E84A3A' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-6 h-fit" style={{ backgroundColor: 'rgba(240,237,224,0.03)', border: '1px solid rgba(240,237,224,0.08)' }}>
              <h3 className="text-[#F0EDE0] font-bold mb-4">订单汇总</h3>
              <div className="flex justify-between text-sm mb-2" style={{ color: '#F0EDE0' }}>
                <span className="opacity-50">商品总数</span>
                <span>{cart.reduce((s, i) => s + i.quantity, 0)} 件</span>
              </div>
              <div className="flex justify-between text-lg font-bold mb-6" style={{ color: '#F0EDE0' }}>
                <span>合计</span>
                <span style={{ color: '#E84A3A' }}>¥{total.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{ backgroundColor: '#E84A3A', color: '#F0EDE0', opacity: submitting ? 0.7 : 1 }}
              >
                <CreditCard size={16} />
                {submitting ? '处理中...' : '立即下单（模拟支付）'}
              </button>
              <p className="text-[10px] opacity-40 text-center mt-3" style={{ color: '#F0EDE0' }}>
                演示环境不处理真实支付
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
